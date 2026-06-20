import { useCallback, useEffect, useMemo, useState } from 'react';
import { DS, TYPE, SANS } from '../../lib/designSystem';
import { supabase } from '../../lib/supabaseBrowser';
import { AppShell, HeroTask, ProgressLine, SectionLabel, TaskRow } from '../calm/CalmKit';
import { Banner, Button, Card, Select } from '../calm/CalmControls';
import FamilyTaskSheet from './FamilyTaskSheet';
import { buildFamilyTodayModel, familyEmptyModel } from './familyTodayAdapter';

function rowsFromPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.workflows)) return payload.workflows;
  if (Array.isArray(payload?.estates)) return payload.estates;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function estateLabel(workflow) {
  if (!workflow) return 'Family record';
  return workflow.deceased_name ? `Estate of ${workflow.deceased_name}` : workflow.name || workflow.estate_name || 'Family record';
}

function LoadingState() {
  return (
    <div style={{ padding: '22px 20px 90px' }}>
      <div style={{ height: 22, width: '66%', background: DS.color.hair, borderRadius: DS.radius.pill, marginBottom: 10 }} />
      <div style={{ height: 13, width: '82%', background: DS.color.hair, borderRadius: DS.radius.pill, marginBottom: 22 }} />
      {[0, 1, 2].map((item) => (
        <div key={item} style={{ height: item === 0 ? 142 : 72, background: DS.color.card, border: `1px solid ${DS.color.hair}`, borderRadius: DS.radius.lg, marginBottom: 12 }} />
      ))}
    </div>
  );
}

function EmptyToday({ onRefresh }) {
  return (
    <Card style={{ marginTop: 18 }}>
      <p style={{ ...TYPE.label, color: DS.color.sageDeep, margin: '0 0 8px' }}>Nothing needs you right now</p>
      <h2 style={{ ...TYPE.h2, color: DS.color.ink, margin: 0 }}>Your family record is quiet.</h2>
      <p style={{ ...TYPE.small, color: DS.color.mid, margin: '8px 0 14px' }}>When a next step needs your review, Passage will bring it back to the top.</p>
      <Button variant="secondary" onClick={onRefresh}>Check again</Button>
    </Card>
  );
}

export default function FamilyTodayApp({ user, session, onSignOut }) {
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  const loadWorkflows = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const token = session?.access_token || (await supabase.auth.getSession())?.data?.session?.access_token || '';
      let rows = [];
      if (token) {
        const response = await fetch('/api/myEstates', { headers: { Authorization: `Bearer ${token}` } });
        if (response.ok) rows = rowsFromPayload(await response.json());
      }
      if (!rows.length) {
        const { data, error: dbError } = await supabase
          .from('workflows')
          .select('id, name, deceased_name, coordinator_name, coordinator_email, date_of_death, status, activation_status, trigger_type, path, mode, seat_status, estate_name, created_at, updated_at')
          .eq('user_id', user.id)
          .neq('status', 'archived')
          .order('created_at', { ascending: false });
        if (dbError) throw dbError;
        rows = data || [];
      }
      setWorkflows(rows);
      setSelectedWorkflowId((current) => current || rows[0]?.id || '');
    } catch (err) {
      setError(err?.message || 'Passage could not load your family records yet.');
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, user?.id]);

  const loadTasks = useCallback(async (workflowId) => {
    if (!workflowId) {
      setTasks([]);
      return;
    }
    setTasksLoading(true);
    setError('');
    try {
      const { data, error: taskError } = await supabase
        .from('tasks')
        .select('*')
        .eq('workflow_id', workflowId)
        .order('created_at', { ascending: true });
      if (taskError) throw taskError;
      setTasks(data || []);
    } catch (err) {
      setError(err?.message || 'Passage could not load next steps for this family record.');
      setTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  useEffect(() => {
    loadTasks(selectedWorkflowId);
  }, [loadTasks, selectedWorkflowId]);

  const selectedWorkflow = workflows.find((workflow) => String(workflow.id) === String(selectedWorkflowId)) || workflows[0] || null;
  const model = useMemo(() => selectedWorkflow ? buildFamilyTodayModel({ workflow: selectedWorkflow, tasks, user }) : familyEmptyModel(null), [selectedWorkflow, tasks, user]);

  const openTask = (task) => {
    setSelectedTask(task);
    setSaveError('');
    setNotice('');
  };

  const markLocalTask = (task, status, notes) => {
    setTasks((current) => current.map((row) => {
      const rowId = row.id || row.dbId || row.task_id;
      if (String(rowId) !== String(task.dbId || task.raw?.id || task.id)) return row;
      return {
        ...row,
        status,
        notes,
        completed: status === 'handled',
        completed_at: status === 'handled' ? new Date().toISOString() : row.completed_at,
        updated_at: new Date().toISOString(),
      };
    }));
  };

  const saveTaskStatus = async (task, payload) => {
    setSaving(true);
    setSaveError('');
    setNotice('');
    try {
      const finalStatus = payload.status === 'blocked' ? 'blocked' : payload.status === 'waiting' ? 'waiting' : 'handled';
      if (!task.dbId) {
        markLocalTask(task, finalStatus, payload.notes || '');
        setNotice('Saved here. This step will sync once it has a database record.');
        return;
      }
      const token = session?.access_token || (await supabase.auth.getSession())?.data?.session?.access_token || '';
      const response = await fetch(`/api/tasks/${task.dbId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: finalStatus,
          channel: 'record',
          recipient: task.contract?.waitingOn || '',
          detail: payload.detail || 'Family status saved.',
          notes: payload.notes || '',
          outcomeStatus: finalStatus,
          actor: user?.email || 'Passage',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Passage could not save that update yet.');
      markLocalTask(task, finalStatus, payload.notes || '');
      setNotice(finalStatus === 'handled' ? 'Saved as done on the family record.' : 'Saved. Passage will keep this visible.');
    } catch (err) {
      setSaveError(err?.message || 'Passage could not save that update yet.');
    } finally {
      setSaving(false);
    }
  };

  const refresh = () => {
    loadWorkflows();
    if (selectedWorkflowId) loadTasks(selectedWorkflowId);
  };

  return (
    <div style={{ minHeight: '100vh', background: DS.color.page, fontFamily: SANS, padding: '18px 12px' }}>
      <AppShell brand="Passage" active="Today">
        {loading ? <LoadingState /> : (
          <div style={{ padding: '18px 18px 88px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 16 }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...TYPE.label, color: DS.color.soft, margin: '0 0 4px' }}>Today</p>
                <h1 style={{ ...TYPE.display, color: DS.color.ink, margin: 0 }}>{model.estateName}</h1>
              </div>
              <button type="button" onClick={onSignOut} style={{ minHeight: DS.tap.min, border: `1px solid ${DS.color.border}`, background: DS.color.card, color: DS.color.mid, borderRadius: DS.radius.md, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, padding: '8px 10px', cursor: 'pointer' }}>Sign out</button>
            </div>

            {workflows.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <Select aria-label="Choose family record" value={selectedWorkflowId} onChange={(event) => setSelectedWorkflowId(event.target.value)}>
                  {workflows.map((workflow) => <option key={workflow.id} value={workflow.id}>{estateLabel(workflow)}</option>)}
                </Select>
              </div>
            )}

            {error && <div style={{ marginBottom: 14 }}><Banner tone="danger">{error}</Banner></div>}

            {!selectedWorkflow && !error && (
              <Card>
                <p style={{ ...TYPE.label, color: DS.color.sageDeep, margin: '0 0 8px' }}>Start a family record</p>
                <h2 style={{ ...TYPE.h2, color: DS.color.ink, margin: 0 }}>Everything lives in one calm place.</h2>
                <p style={{ ...TYPE.small, color: DS.color.mid, margin: '8px 0 14px' }}>Create or open a family record so Passage can keep next steps, people, messages, and saved proof together.</p>
                <Button onClick={() => window.location.assign('/?legacy=1')}>Open setup</Button>
              </Card>
            )}

            {selectedWorkflow && (
              <>
                <ProgressLine done={model.done} total={model.total} />

                {tasksLoading ? <LoadingState /> : (
                  <>
                    {model.startHere ? (
                      <>
                        <SectionLabel>Start here</SectionLabel>
                        <HeroTask task={model.startHere} onOpen={openTask} />
                      </>
                    ) : <EmptyToday onRefresh={refresh} />}

                    {model.whenReady.length > 0 && (
                      <>
                        <SectionLabel>When you're ready</SectionLabel>
                        <Card pad={6}>
                          {model.whenReady.map((task) => <TaskRow key={task.id} task={task} onOpen={openTask} />)}
                        </Card>
                      </>
                    )}

                    {model.waiting.length > 0 && (
                      <>
                        <SectionLabel>Waiting on others</SectionLabel>
                        <Card pad={6}>
                          {model.waiting.map((task) => <TaskRow key={task.id} task={task} onOpen={openTask} muted />)}
                        </Card>
                      </>
                    )}

                    {model.proofSaved.length > 0 && (
                      <>
                        <SectionLabel>Proof saved</SectionLabel>
                        <Card pad={6}>
                          {model.proofSaved.map((task) => <TaskRow key={task.id} task={task} onOpen={openTask} muted />)}
                        </Card>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}
      </AppShell>

      <FamilyTaskSheet task={selectedTask} saving={saving} error={saveError} notice={notice} onClose={() => setSelectedTask(null)} onSave={saveTaskStatus} />
    </div>
  );
}
