import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { ActivityIndicator, Alert as NativeAlert, Pressable, View } from 'react-native';

import { Screen } from '@/components/layout/screen';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { DateInput } from '@/components/ui/date-input';
import { FormField } from '@/components/ui/form-field';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { ListRow } from '@/components/ui/list-row';
import { MoneyInput } from '@/components/ui/money-input';
import { MoneyText } from '@/components/ui/money-text';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Text } from '@/components/ui/text';
import { ChargeCard, FilePickerField, PaymentCard, ReceiptViewer, useCharges, usePayments } from '@/features/finance';
import { formatDateShort, todayISO } from '@/lib/dates';
import { toAppError } from '@/lib/errors';
import { toCents } from '@/lib/money';
import { useActiveOrganization } from '@/providers/auth-provider';
import type { PickedFile } from '@/services/storage';

import { ADMINISTRATION_LABELS, GUARANTEE_LABELS, INCREASE_LABELS, LEASE_USE_LABELS, leaseTermCaption } from '../domain';
import { useLease, useLeaseActions, useLeaseDocuments, useRentAdjustments, useUploadLeaseDocument } from '../hooks';

type Panel = 'renew' | 'adjust' | 'terminate' | 'document' | null;

export function LeaseDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { organizationId } = useActiveOrganization();
  const lease = useLease(organizationId, id);
  const documents = useLeaseDocuments(organizationId, id);
  const adjustments = useRentAdjustments(organizationId, id);
  const charges = useCharges(organizationId, { leaseId: id });
  const payments = usePayments(organizationId, { leaseId: id });
  const actions = useLeaseActions(organizationId, id);
  const upload = useUploadLeaseDocument(organizationId, lease.data);

  const [panel, setPanel] = React.useState<Panel>(null);
  const [date, setDate] = React.useState('');
  const [text, setText] = React.useState('');
  const [rent, setRent] = React.useState('');
  const [file, setFile] = React.useState<PickedFile | null>(null);
  const [shared, setShared] = React.useState(true);

  const open = (next: Panel) => {
    setPanel(panel === next ? null : next);
    setDate(next === 'terminate' ? todayISO() : '');
    setText(next === 'document' ? 'Contrato firmado' : '');
    setRent('');
    setFile(null);
  };

  const mutationError = [actions.activate, actions.deleteDraft, actions.renew, actions.terminate, actions.adjust, upload]
    .map((m) => m.error)
    .find(Boolean);

  if (lease.isPending) return <Screen title="Contrato" onBack={() => router.back()}><ActivityIndicator className="mt-10" /></Screen>;
  if (lease.error || !lease.data) {
    return (
      <Screen title="Contrato" onBack={() => router.back()}>
        <Alert tone="danger" title="No pudimos cargar el contrato">{toAppError(lease.error).message}</Alert>
      </Screen>
    );
  }
  const l = lease.data;
  const isActive = l.status === 'active';

  const confirmTerminate = () =>
    NativeAlert.alert(
      '¿Terminar este contrato?',
      `${l.propertyName} quedará disponible y se anularán los cobros posteriores al ${formatDateShort(date)} que no tengan pagos. El historial se conserva.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Terminar contrato',
          style: 'destructive',
          onPress: () => actions.terminate.mutate({ date, reason: text }, { onSuccess: () => setPanel(null) }),
        },
      ],
    );

  const confirmDelete = () =>
    NativeAlert.alert('¿Eliminar el borrador?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => actions.deleteDraft.mutate(undefined, { onSuccess: () => router.back() }) },
    ]);

  return (
    <Screen title={l.propertyName} subtitle={l.tenantName ?? undefined} onBack={() => router.back()}>
      {mutationError ? <Alert tone="danger">{toAppError(mutationError).message}</Alert> : null}

      <Card className="gap-2 p-4">
        <View className="flex-row items-center justify-between">
          <StatusBadge entity="lease" status={l.displayStatus} />
          <Text variant="caption" className="text-muted-foreground">{leaseTermCaption(l)}</Text>
        </View>
        <ListRow label="Canon vigente"><MoneyText amountCents={l.currentRentCents} className="font-sans-semibold text-sm" /></ListRow>
        <ListRow label="Administración">
          {l.administrationMode === 'separate' ? <MoneyText amountCents={l.administrationCents} className="text-sm" /> : ADMINISTRATION_LABELS[l.administrationMode]}
        </ListRow>
        <ListRow label="Día de pago">{`Día ${l.paymentDay} de cada mes`}</ListRow>
        <ListRow label="Vigencia">{`${formatDateShort(l.startDate)} – ${formatDateShort(l.endDate)}`}</ListRow>
        {l.billingStartDate ? <ListRow label="Se cobra desde">{formatDateShort(l.billingStartDate)}</ListRow> : null}
        <ListRow label="Uso">{LEASE_USE_LABELS[l.leaseUse]}</ListRow>
        <ListRow label="Garantía">{GUARANTEE_LABELS[l.guaranteeType]}</ListRow>
        <ListRow label="Reajuste">{l.increaseType === 'fixed_percentage' ? `${l.annualIncreasePercentage} % anual` : INCREASE_LABELS[l.increaseType]}</ListRow>
        {l.terminatedOn ? <ListRow label="Terminado el">{formatDateShort(l.terminatedOn)}</ListRow> : null}
        {l.terminationReason ? <ListRow label="Motivo">{l.terminationReason}</ListRow> : null}
      </Card>

      {l.displayStatus === 'extension' ? (
        <Alert tone="warning" title="Contrato en prórroga">Venció sin terminarse. Renuévalo con una nueva fecha final o termínalo.</Alert>
      ) : null}

      {l.status === 'draft' ? (
        <View className="gap-2">
          <Button size="lg" loading={actions.activate.isPending} onPress={() => actions.activate.mutate()}>Activar contrato</Button>
          <Button variant="ghost" iconStart="trash-2" onPress={confirmDelete}>Eliminar borrador</Button>
        </View>
      ) : null}

      {isActive ? (
        <View className="gap-2">
          <View className="flex-row gap-2">
            <Button className="flex-1" iconStart="receipt" onPress={() => router.push(`/payments/new?leaseId=${l.id}`)}>Registrar pago</Button>
            <Button className="flex-1" variant="secondary" iconStart="plus" onPress={() => router.push(`/charges/new?leaseId=${l.id}`)}>Nuevo cobro</Button>
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Button size="sm" variant="outline" onPress={() => open('renew')}>Renovar</Button>
            <Button size="sm" variant="outline" onPress={() => open('adjust')}>Reajustar canon</Button>
            <Button size="sm" variant="outline" onPress={() => open('terminate')}>Terminar</Button>
          </View>
        </View>
      ) : null}

      {panel === 'renew' ? (
        <Card className="gap-3 p-4">
          <Text variant="h3">Renovar contrato</Text>
          <FormField label="Nueva fecha final" description={`Hoy vence el ${formatDateShort(l.endDate)}.`}>
            <DateInput value={date} onValueChange={setDate} />
          </FormField>
          <Button loading={actions.renew.isPending} disabled={!date}
            onPress={() => actions.renew.mutate(date, { onSuccess: () => setPanel(null) })}>Renovar hasta esa fecha</Button>
        </Card>
      ) : null}

      {panel === 'adjust' ? (
        <Card className="gap-3 p-4">
          <Text variant="h3">Reajustar canon</Text>
          <Text variant="body-sm" className="text-muted-foreground">
            {l.leaseUse === 'residential'
              ? 'En vivienda, el canon sube cada 12 meses como máximo el IPC del año anterior. Aplica a los meses que aún no se han cobrado.'
              : 'Aplica a los meses que aún no se han cobrado.'}
          </Text>
          <FormField label="Nuevo canon"><MoneyInput value={rent} onValueChange={setRent} /></FormField>
          <FormField label="A partir del"><DateInput value={date} onValueChange={setDate} /></FormField>
          <FormField label="Motivo" optional><Input value={text} onChangeText={setText} placeholder="Reajuste anual por IPC" /></FormField>
          <Button loading={actions.adjust.isPending} disabled={!date || !rent}
            onPress={() => actions.adjust.mutate({ effectiveFrom: date, rentPesos: Number(rent), reason: text }, { onSuccess: () => setPanel(null) })}>
            Aplicar reajuste
          </Button>
        </Card>
      ) : null}

      {panel === 'terminate' ? (
        <Card className="gap-3 p-4">
          <Text variant="h3">Terminar contrato</Text>
          <FormField label="Fecha de terminación"><DateInput value={date} onValueChange={setDate} /></FormField>
          <FormField label="Motivo"><Input value={text} onChangeText={setText} placeholder="Entrega del inmueble" /></FormField>
          <Button variant="destructive" loading={actions.terminate.isPending} disabled={!date || !text.trim()} onPress={confirmTerminate}>
            Terminar contrato
          </Button>
        </Card>
      ) : null}

      {(adjustments.data ?? []).length > 0 ? (
        <View className="gap-2">
          <SectionHeader title="Reajustes" />
          {(adjustments.data ?? []).map((a) => (
            <Card key={a.id} className="flex-row items-center justify-between p-3">
              <Text variant="body-sm">Desde {formatDateShort(a.effective_from)}</Text>
              <View className="items-end">
                <MoneyText amountCents={toCents(a.new_rent)} className="font-sans-semibold text-sm" />
                <Text variant="caption" className="text-muted-foreground">{`${a.percentage > 0 ? '+' : ''}${String(a.percentage).replace('.', ',')} %`}</Text>
              </View>
            </Card>
          ))}
        </View>
      ) : null}

      <View className="gap-2">
        <SectionHeader title="Documentos" actionLabel={l.status !== 'draft' ? 'Adjuntar' : undefined} onAction={() => open('document')} />
        {panel === 'document' ? (
          <Card className="gap-3 p-4">
            <FormField label="Nombre del documento"><Input value={text} onChangeText={setText} /></FormField>
            <FilePickerField value={file} onChange={setFile} />
            <Checkbox checked={shared} onCheckedChange={setShared} label="El inquilino puede verlo en su app" />
            <Button loading={upload.isPending} disabled={!file || !text.trim()} iconStart="upload"
              onPress={() => file && upload.mutate({ file, title: text.trim(), shared }, { onSuccess: () => setPanel(null) })}>
              Subir documento
            </Button>
          </Card>
        ) : null}
        {(documents.data ?? []).length === 0 && panel !== 'document' ? (
          <Text variant="body-sm" className="text-muted-foreground">Aún no hay documentos. Adjunta el contrato firmado.</Text>
        ) : null}
        {(documents.data ?? []).map((doc) => <DocumentRow key={doc.id} title={doc.title} path={doc.storage_path} shared={doc.visibility === 'shared'} />)}
      </View>

      {(charges.data ?? []).length > 0 ? (
        <View className="gap-2">
          <SectionHeader title="Cobros" />
          {(charges.data ?? []).slice(0, 6).map((c) => <ChargeCard key={c.id} charge={c} />)}
        </View>
      ) : null}

      {(payments.data ?? []).length > 0 ? (
        <View className="gap-2">
          <SectionHeader title="Pagos" />
          {(payments.data ?? []).slice(0, 6).map((p) => <PaymentCard key={p.id} payment={p} onPress={() => router.push(`/payments/${p.id}`)} />)}
        </View>
      ) : null}
    </Screen>
  );
}

function DocumentRow({ title, path, shared }: { title: string; path: string; shared: boolean }) {
  const [open, setOpen] = React.useState(false);
  return (
    <Card className="gap-2 p-3">
      <Pressable role="button" onPress={() => setOpen((v) => !v)} className="flex-row items-center gap-3 active:opacity-70">
        <Icon name="file-text" size={20} className="text-primary" />
        <Text variant="body-sm" numberOfLines={1} className="flex-1">{title}</Text>
        <Text variant="caption" className="text-muted-foreground">{shared ? 'Compartido' : 'Solo tú'}</Text>
      </Pressable>
      {open ? <ReceiptViewer path={path} bucket="lease-documents" /> : null}
    </Card>
  );
}
