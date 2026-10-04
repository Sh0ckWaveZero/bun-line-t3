import { useState } from "react";
import { useToast } from "@/components/common/ToastProvider";
import type { CronJobNotice } from "@/features/cron-jobs/types";
import type { CronJobMutationInput } from "@/features/cron-jobs/hooks/useCronJobs";
import type { CronJob } from "@/features/cron-jobs/types";

interface UseCronJobActionsArgs {
  isMutating: boolean;
  createJob: (input: CronJobMutationInput) => Promise<CronJob>;
  updateJob: (
    id: string,
    input: Partial<CronJobMutationInput>,
  ) => Promise<CronJob>;
  deleteJob: (id: string) => Promise<void>;
  runJob: (id: string) => Promise<{ status: string; message: string }>;
}

export interface UseCronJobActionsResult {
  formOpen: boolean;
  editingJob: CronJob | null;
  selectedJob: CronJob | null;
  notice: CronJobNotice | null;
  handleOpenCreate: () => void;
  handleOpenEdit: (job: CronJob) => void;
  handleSaveJob: (input: CronJobMutationInput) => Promise<void>;
  handleToggleJob: (job: CronJob) => Promise<void>;
  handleRunJob: (job: CronJob) => Promise<void>;
  handleDeleteJob: (job: CronJob) => Promise<void>;
  handleSelectJob: (job: CronJob) => void;
  handleCloseForm: () => void;
  handleCloseActions: () => void;
  handleDismissNotice: () => void;
}

export function useCronJobActions({
  isMutating,
  createJob,
  updateJob,
  deleteJob,
  runJob,
}: UseCronJobActionsArgs): UseCronJobActionsResult {
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [selectedJob, setSelectedJob] = useState<CronJob | null>(null);
  const [notice, setNotice] = useState<CronJobNotice | null>(null);

  const handleOpenCreate = () => {
    setNotice(null);
    setEditingJob(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (job: CronJob) => {
    setNotice(null);
    setSelectedJob(null);
    setEditingJob(job);
    setFormOpen(true);
  };

  const handleSaveJob = async (input: CronJobMutationInput) => {
    if (editingJob) {
      await updateJob(editingJob.id, input);
      setNotice({ type: "success", message: "แก้ไข Cron Job เรียบร้อยแล้ว" });
    } else {
      await createJob(input);
      setNotice({ type: "success", message: "สร้าง Cron Job เรียบร้อยแล้ว" });
    }

    setFormOpen(false);
    setEditingJob(null);
  };

  const handleToggleJob = async (job: CronJob) => {
    try {
      await updateJob(job.id, { enabled: !job.enabled });
      setSelectedJob(null);
      setNotice(null);
      showToast({
        title: job.enabled
          ? "หยุด Cron Job ชั่วคราวแล้ว"
          : "เปิดใช้งาน Cron Job แล้ว",
        description: job.name,
        type: "success",
      });
    } catch (toggleError) {
      setNotice(null);
      showToast({
        title: "เปลี่ยนสถานะ Cron Job ไม่สำเร็จ",
        description:
          toggleError instanceof Error
            ? toggleError.message
            : "กรุณาลองใหม่อีกครั้ง",
        type: "error",
      });
    }
  };

  const handleRunJob = async (job: CronJob) => {
    try {
      const result = await runJob(job.id);
      setSelectedJob(null);
      setNotice({
        type: result.status === "succeeded" ? "success" : "error",
        message: `${job.name}: ${result.message}`,
      });
    } catch (runError) {
      setNotice({
        type: "error",
        message:
          runError instanceof Error
            ? runError.message
            : "รัน Cron Job ไม่สำเร็จ",
      });
    }
  };

  const handleDeleteJob = async (job: CronJob) => {
    try {
      await deleteJob(job.id);
      setSelectedJob(null);
      setNotice({ type: "success", message: "ลบ Cron Job เรียบร้อยแล้ว" });
    } catch (deleteError) {
      setNotice({
        type: "error",
        message:
          deleteError instanceof Error
            ? deleteError.message
            : "ลบ Cron Job ไม่สำเร็จ",
      });
    }
  };

  const handleSelectJob = (job: CronJob) => {
    setSelectedJob(job);
  };

  const handleCloseForm = () => {
    if (!isMutating) {
      setFormOpen(false);
      setEditingJob(null);
    }
  };

  const handleCloseActions = () => {
    setSelectedJob(null);
  };

  const handleDismissNotice = () => {
    setNotice(null);
  };

  return {
    formOpen,
    editingJob,
    selectedJob,
    notice,
    handleOpenCreate,
    handleOpenEdit,
    handleSaveJob,
    handleToggleJob,
    handleRunJob,
    handleDeleteJob,
    handleSelectJob,
    handleCloseForm,
    handleCloseActions,
    handleDismissNotice,
  };
}
