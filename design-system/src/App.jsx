import { useState } from 'react';
import { Download, Plus, Trash2, ArrowRight, Search, FileX } from 'lucide-react';
import {
  Button,
  IconButton,
  Field,
  Input,
  Textarea,
  Select,
  Checkbox,
  Panel,
  StatusTag,
  DataTable,
  Skeleton,
  EmptyState,
  Modal,
  ConfirmDialog,
  useToast,
  PageHeader,
  SectionHeader,
  ResponsiveShell,
  Grid,
  GridItem,
} from './components/index.js';

const SAMPLE_ROWS = [
  { id: 'REC-0231', label: 'Northbound sync', status: 'positive', value: 1284.5, updated: '2 h ago' },
  { id: 'REC-0230', label: 'Boundary check', status: 'caution', value: 312.0, updated: '5 h ago' },
  { id: 'REC-0229', label: 'Index rebuild', status: 'critical', value: 8420.75, updated: '1 d ago' },
  { id: 'REC-0228', label: 'Manifest audit', status: 'neutral', value: 96.2, updated: '2 d ago' },
  { id: 'REC-0227', label: 'Access review', status: 'informative', value: 4510.0, updated: '3 d ago' },
];

const STATUS_LABEL = {
  positive: 'Resolved',
  caution: 'Pending',
  critical: 'Blocked',
  neutral: 'Draft',
  informative: 'In review',
};

export default function App() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);
  const toast = useToast();

  function handleConfirm() {
    setConfirmLoading(true);
    setTimeout(() => {
      setConfirmLoading(false);
      setConfirmOpen(false);
      toast.push({ variant: 'positive', title: 'Record removed', description: 'REC-0229 was deleted permanently.' });
    }, 900);
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero — dark full-width surface, permitted per spec */}
      <header className="bg-dark text-white">
        <ResponsiveShell className="flex flex-col gap-6 py-20">
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-white/50">
            Design System — v0.1
          </span>
          <h1 className="max-w-2xl font-display text-[40px] font-semibold leading-[1.08] tracking-[-0.04em] sm:text-[56px]">
            Swiss Modernism 2.0
          </h1>
          <p className="max-w-lg text-[16px] text-white/70">
            A reusable set of tokens and primitives — strong typography, mathematical spacing,
            one accent color, and restrained decoration.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="accent" size="lg">
              Primary action <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10"
            >
              Secondary
            </Button>
          </div>
        </ResponsiveShell>
      </header>

      <ResponsiveShell className="flex flex-col gap-16 py-14">
        <PageHeader
          eyebrow="Overview"
          title="Component reference"
          description="Every primitive below reads its color, spacing, and motion from the shared token set."
          actions={
            <>
              <IconButton label="Export">
                <Download className="size-4.5" aria-hidden="true" />
              </IconButton>
              <Button variant="solid">
                <Plus className="size-4" aria-hidden="true" /> New item
              </Button>
            </>
          }
        />

        {/* Buttons */}
        <section className="flex flex-col gap-5">
          <SectionHeader title="Buttons" description="Solid, accent, outline, quiet, destructive — plus icon-only." />
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="solid">Solid</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="quiet">Quiet</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="accent" loading>
              Loading
            </Button>
            <Button variant="solid" disabled>
              Disabled
            </Button>
            <IconButton label="Search" variant="outline">
              <Search className="size-4.5" aria-hidden="true" />
            </IconButton>
            <IconButton label="Delete" variant="destructive">
              <Trash2 className="size-4.5" aria-hidden="true" />
            </IconButton>
          </div>
        </section>

        {/* Form */}
        <section className="flex flex-col gap-5">
          <SectionHeader title="Form controls" description="Field wraps every control with a label, hint, or error." />
          <Panel>
            <Grid>
              <GridItem span={6}>
                <Field label="Full name" required>
                  {(fieldProps) => <Input placeholder="Jordan Lee" {...fieldProps} />}
                </Field>
              </GridItem>
              <GridItem span={6}>
                <Field label="Reference code" optional hint="Used for cross-team lookup.">
                  {(fieldProps) => <Input placeholder="REC-0000" {...fieldProps} />}
                </Field>
              </GridItem>
              <GridItem span={6}>
                <Field label="Email" error="Enter a valid email address.">
                  {(fieldProps) => <Input type="email" defaultValue="not-an-email" error {...fieldProps} />}
                </Field>
              </GridItem>
              <GridItem span={6}>
                <Field label="Category">
                  {(fieldProps) => (
                    <Select defaultValue="ops" {...fieldProps}>
                      <option value="ops">Operations</option>
                      <option value="eng">Engineering</option>
                      <option value="fin">Finance</option>
                    </Select>
                  )}
                </Field>
              </GridItem>
              <GridItem span={6}>
                <Field label="Disabled field">
                  {(fieldProps) => <Input placeholder="Not editable" disabled {...fieldProps} />}
                </Field>
              </GridItem>
              <GridItem span={6}>
                <Field label="Verifying">
                  {(fieldProps) => <Input placeholder="Checking availability…" loading {...fieldProps} />}
                </Field>
              </GridItem>
              <GridItem span={12}>
                <Field label="Notes" optional>
                  {(fieldProps) => <Textarea placeholder="Add any relevant context…" rows={4} {...fieldProps} />}
                </Field>
              </GridItem>
              <GridItem span={12}>
                <div className="flex flex-wrap gap-6 pt-1">
                  <Checkbox label="Notify assignees" defaultChecked />
                  <Checkbox label="Require approval" />
                  <Checkbox label="Locked" disabled />
                </div>
              </GridItem>
            </Grid>
          </Panel>
        </section>

        {/* Status tags */}
        <section className="flex flex-col gap-5">
          <SectionHeader title="Status tags" description="Semantic color communicates state only." />
          <div className="flex flex-wrap gap-2.5">
            <StatusTag variant="neutral">Draft</StatusTag>
            <StatusTag variant="accent">Featured</StatusTag>
            <StatusTag variant="positive" dot>
              Resolved
            </StatusTag>
            <StatusTag variant="caution" dot>
              Pending
            </StatusTag>
            <StatusTag variant="critical" dot>
              Blocked
            </StatusTag>
            <StatusTag variant="informative" dot>
              In review
            </StatusTag>
          </div>
        </section>

        {/* Panels */}
        <section className="flex flex-col gap-5">
          <SectionHeader title="Panels" description="Flat by default; hoverable panels strengthen their border." />
          <Grid>
            <GridItem span={4}>
              <Panel hoverable>
                <p className="font-mono text-[11px] uppercase tracking-wide text-fg-muted">Throughput</p>
                <p className="mt-2 font-display text-[28px] font-semibold tracking-[-0.02em] tabular-nums">1,284</p>
                <p className="mt-1 text-[13px] text-fg-muted">+4.2% vs last period</p>
              </Panel>
            </GridItem>
            <GridItem span={4}>
              <Panel hoverable>
                <p className="font-mono text-[11px] uppercase tracking-wide text-fg-muted">Open items</p>
                <p className="mt-2 font-display text-[28px] font-semibold tracking-[-0.02em] tabular-nums">36</p>
                <p className="mt-1 text-[13px] text-fg-muted">8 require review</p>
              </Panel>
            </GridItem>
            <GridItem span={4}>
              <Panel>
                <Panel.Header>
                  <span className="font-display text-[15px] font-semibold">Sectioned panel</span>
                  <StatusTag variant="accent">Beta</StatusTag>
                </Panel.Header>
                <p className="text-[13px] text-fg-secondary">Header, divider, and footer slots share the same rule weight.</p>
                <Panel.Divider />
                <Panel.Footer>
                  <span className="text-[13px] text-fg-muted">Updated 2h ago</span>
                  <Button variant="quiet" className="h-9 px-3 text-[13px]">
                    View
                  </Button>
                </Panel.Footer>
              </Panel>
            </GridItem>
          </Grid>
        </section>

        {/* Data table */}
        <section className="flex flex-col gap-5">
          <SectionHeader
            title="Data table"
            description="Overflow-safe, tabular numerics, skeleton and empty states."
            action={
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowLoading((v) => !v)} className="h-9 px-3 text-[13px]">
                  Toggle loading
                </Button>
                <Button variant="outline" onClick={() => setShowEmpty((v) => !v)} className="h-9 px-3 text-[13px]">
                  Toggle empty
                </Button>
              </div>
            }
          />
          <DataTable
            loading={showLoading}
            data={showEmpty ? [] : SAMPLE_ROWS}
            emptyMessage="No records match this view."
            columns={[
              { key: 'id', header: 'Reference', render: (row) => <span className="font-mono text-[13px]">{row.id}</span> },
              { key: 'label', header: 'Label' },
              {
                key: 'status',
                header: 'Status',
                render: (row) => <StatusTag variant={row.status}>{STATUS_LABEL[row.status]}</StatusTag>,
              },
              {
                key: 'value',
                header: 'Value',
                align: 'right',
                numeric: true,
                render: (row) => row.value.toLocaleString(undefined, { minimumFractionDigits: 2 }),
              },
              { key: 'updated', header: 'Updated', align: 'right' },
            ]}
          />
        </section>

        {/* Skeleton + empty state */}
        <section className="flex flex-col gap-5">
          <SectionHeader title="Loading & empty states" />
          <Grid>
            <GridItem span={6}>
              <Panel className="flex flex-col gap-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
              </Panel>
            </GridItem>
            <GridItem span={6}>
              <Panel padding={false}>
                <EmptyState
                  icon={FileX}
                  title="Nothing here yet"
                  description="Items you create will appear in this list."
                  action={
                    <Button variant="outline" className="h-9 px-3 text-[13px]">
                      Create item
                    </Button>
                  }
                />
              </Panel>
            </GridItem>
          </Grid>
        </section>

        {/* Overlays */}
        <section className="flex flex-col gap-5">
          <SectionHeader title="Modal, confirmation & toast" />
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
            <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="size-4" aria-hidden="true" /> Delete record
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.push({ variant: 'informative', title: 'Saved', description: 'Your changes were saved.' })}
            >
              Trigger toast
            </Button>
          </div>
        </section>
      </ResponsiveShell>

      {/* Footer — dark full-width surface, permitted per spec */}
      <footer className="bg-dark text-white/60">
        <ResponsiveShell className="flex flex-col gap-2 py-10 text-[13px] sm:flex-row sm:items-center sm:justify-between">
          <span>Swiss Modernism 2.0 — internal design system</span>
          <span className="font-mono text-[11px] uppercase tracking-wide">Tokens · Primitives · Grid</span>
        </ResponsiveShell>
      </footer>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Edit record"
        description="Changes are saved to this record only."
        footer={
          <>
            <Button variant="quiet" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="accent" onClick={() => setModalOpen(false)}>
              Save changes
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Field label="Label" required>
            {(fieldProps) => <Input defaultValue="Northbound sync" {...fieldProps} />}
          </Field>
          <Field label="Notes" optional>
            {(fieldProps) => <Textarea rows={3} placeholder="Optional context…" {...fieldProps} />}
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
        loading={confirmLoading}
        destructive
        title="Delete this record?"
        description="This action cannot be undone. The record and its history will be permanently removed."
        confirmLabel="Delete"
      />
    </div>
  );
}
