"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBitkubConnection } from "@/features/exchanges/hooks/useBitkubConnection";
import {
  bitkubCredentialsSchema,
  type BitkubCredentials,
} from "@/features/exchanges/lib/bitkub-credentials";
import { useBitkubCredentialDraft } from "@/features/settings/lib/bitkub-credential-draft-context";
import { SettingsSection } from "./SettingsSection";

/** ข้อความสถานะการเชื่อมต่อ (ดึง ternary ซ้อนออกจาก JSX) */
const getStatusText = ({
  isLoading,
  isConnectionUnknown,
  isConnected,
  keyHint,
}: {
  isLoading: boolean;
  isConnectionUnknown: boolean;
  isConnected: boolean;
  keyHint: string | null | undefined;
}): string => {
  if (isLoading) return "กำลังตรวจสอบการเชื่อมต่อ";
  if (isConnectionUnknown) return "ตรวจสอบไม่ได้";
  if (isConnected) return `เชื่อมต่อแล้ว ${keyHint ?? ""}`;
  return "ยังไม่ได้เชื่อมต่อ";
};

interface KeyEntryToggleProps {
  isKeyEntryOpen: boolean;
  isFormBusy: boolean;
  onToggle: () => void;
  /** ปุ่มในบล็อก "ตรวจสอบไม่ได้" กับบล็อก "เชื่อมต่อแล้ว" ต่างป้ายกัน */
  openLabel: string;
}

type BitkubConnectionQuery = ReturnType<
  typeof useBitkubConnection
>["connection"];

/** ธงสถานะการเชื่อมต่อจากผล query — ดึง ternary ซ้อนออกจาก component */
const getConnectionFlags = (connection: BitkubConnectionQuery) => {
  const hasConnectionStatus = Boolean(connection.data) && !connection.isError;
  return {
    hasConnectionStatus,
    isConnectionUnknown: connection.isError,
    isConnected: hasConnectionStatus && (connection.data?.connected ?? false),
    isConfigured: hasConnectionStatus && connection.data?.configured,
  };
};

/** โชว์ฟอร์ม key เมื่อ: เชื่อมต่อแล้วและเปิดฟอร์มไว้ / ระบบยังไม่พร้อม / ตรวจไม่ได้และผู้ใช้เปิดฟอร์มเอง */
const canShowKeyForm = ({
  isConnected,
  isConfigured,
  isConnectionUnknown,
  isKeyEntryOpen,
}: {
  isConnected: boolean;
  isConfigured: boolean | undefined;
  isConnectionUnknown: boolean;
  isKeyEntryOpen: boolean;
}): boolean =>
  isConnected
    ? isKeyEntryOpen
    : isConfigured || (isConnectionUnknown && isKeyEntryOpen);

/** บล็อก "ตรวจสอบไม่ได้" — ปุ่มลองใหม่ + ปุ่มเปิดฟอร์มกรอก key */
const ConnectionUnknownBlock = ({
  connection,
  isKeyEntryOpen,
  isFormBusy,
  onToggleKeyEntry,
}: {
  connection: BitkubConnectionQuery;
  isKeyEntryOpen: boolean;
  isFormBusy: boolean;
  onToggleKeyEntry: () => void;
}) => (
  <div className="space-y-3">
    <p className="text-muted-foreground text-sm">
      ยังตรวจสอบไม่ได้ว่ามี key เชื่อมต่ออยู่หรือไม่ หากมี key อยู่แล้ว
      การเชื่อมต่อใหม่สำเร็จจะแทนที่ key เดิม
    </p>
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={connection.isFetching}
        onClick={() => void connection.refetch()}
      >
        ลองตรวจสอบสถานะอีกครั้ง
      </Button>
      <KeyEntryToggle
        isKeyEntryOpen={isKeyEntryOpen}
        isFormBusy={isFormBusy}
        onToggle={onToggleKeyEntry}
        openLabel="กรอก API Key"
      />
    </div>
  </div>
);

/** แถว actions เมื่อเชื่อมต่อแล้ว — ปุ่มเปิดฟอร์มเปลี่ยน key + ยกเลิกการเชื่อมต่อ */
const ConnectedActions = ({
  isKeyEntryOpen,
  isFormBusy,
  onToggleKeyEntry,
  onDisconnect,
}: {
  isKeyEntryOpen: boolean;
  isFormBusy: boolean;
  onToggleKeyEntry: () => void;
  onDisconnect: () => void;
}) => (
  <div className="flex flex-wrap gap-2">
    <KeyEntryToggle
      isKeyEntryOpen={isKeyEntryOpen}
      isFormBusy={isFormBusy}
      onToggle={onToggleKeyEntry}
      openLabel="เปลี่ยน API Key"
    />
    <Button
      type="button"
      variant="outline"
      disabled={isFormBusy}
      onClick={onDisconnect}
    >
      ยกเลิกการเชื่อมต่อ
    </Button>
  </div>
);

/** ปุ่มกัก/เปิดฟอร์มกรอก key — ใช้ร่วมสองบล็อก */
const KeyEntryToggle = ({
  isKeyEntryOpen,
  isFormBusy,
  onToggle,
  openLabel,
}: KeyEntryToggleProps) => (
  <Button
    type="button"
    variant="outline"
    disabled={isFormBusy}
    aria-expanded={isKeyEntryOpen}
    aria-controls="settings-bitkub-key-form"
    onClick={onToggle}
  >
    {isKeyEntryOpen ? "ซ่อนช่องกรอก API Key" : openLabel}
  </Button>
);

interface KeyFormProps {
  isConnected: boolean;
  isFormBusy: boolean;
  register: ReturnType<
    typeof useForm<BitkubCredentials, undefined, BitkubCredentials>
  >["register"];
  fieldErrors: {
    apiKey?: { message?: string };
    apiSecret?: { message?: string };
  };
  onSubmit: (event?: React.BaseSyntheticEvent) => void | Promise<void>;
  onCredentialChange: (patch: Partial<BitkubCredentials>) => void;
}

/** ฟอร์มกรอก API key/secret — แยกออกจากการ์ดสถานะเพื่อลดขนาด/complexity */
const KeyForm = ({
  isConnected,
  isFormBusy,
  register,
  fieldErrors,
  onSubmit,
  onCredentialChange,
}: KeyFormProps) => {
  const apiKeyField = register("apiKey");
  const apiSecretField = register("apiSecret");

  return (
    <form id="settings-bitkub-key-form" onSubmit={onSubmit} noValidate>
      {isConnected && (
        <p className="text-muted-foreground mb-3 text-sm">
          API Key ใหม่จะแทนที่ข้อมูลรับรองเดิม
        </p>
      )}
      <fieldset disabled={isFormBusy} className="space-y-3">
        <legend className="sr-only">ข้อมูลรับรอง Bitkub</legend>
        <div>
          <label
            htmlFor="settings-bitkub-api-key"
            className="mb-1 block text-sm"
          >
            API key
          </label>
          <Input
            id="settings-bitkub-api-key"
            type="password"
            autoComplete="off"
            spellCheck={false}
            required
            {...apiKeyField}
            onChange={(event) => {
              const value = event.currentTarget.value;
              void apiKeyField.onChange(event);
              onCredentialChange({ apiKey: value });
            }}
            aria-invalid={Boolean(fieldErrors.apiKey)}
            aria-describedby={
              fieldErrors.apiKey ? "settings-bitkub-api-key-error" : undefined
            }
          />
          {fieldErrors.apiKey && (
            <p
              id="settings-bitkub-api-key-error"
              role="alert"
              className="text-destructive mt-1 text-sm"
            >
              {fieldErrors.apiKey.message}
            </p>
          )}
        </div>
        <div>
          <label
            htmlFor="settings-bitkub-api-secret"
            className="mb-1 block text-sm"
          >
            API secret
          </label>
          <Input
            id="settings-bitkub-api-secret"
            type="password"
            autoComplete="off"
            spellCheck={false}
            required
            {...apiSecretField}
            onChange={(event) => {
              const value = event.currentTarget.value;
              void apiSecretField.onChange(event);
              onCredentialChange({ apiSecret: value });
            }}
            aria-invalid={Boolean(fieldErrors.apiSecret)}
            aria-describedby={
              fieldErrors.apiSecret
                ? "settings-bitkub-api-secret-error"
                : undefined
            }
          />
          {fieldErrors.apiSecret && (
            <p
              id="settings-bitkub-api-secret-error"
              role="alert"
              className="text-destructive mt-1 text-sm"
            >
              {fieldErrors.apiSecret.message}
            </p>
          )}
        </div>
        <Button type="submit" disabled={isFormBusy}>
          {isFormBusy
            ? "กำลังเชื่อมต่อ…"
            : isConnected
              ? "บันทึก API Key ใหม่"
              : "เชื่อมต่อ Bitkub"}
        </Button>
      </fieldset>
    </form>
  );
};

export function BitkubConnectionSettings() {
  const {
    connection,
    error,
    isBusy,
    message,
    handleConnect,
    handleDisconnect,
  } = useBitkubConnection();
  const { credentials, updateCredentials, clearCredentials } =
    useBitkubCredentialDraft();
  const [isKeyEntryOpen, setIsKeyEntryOpen] = useState(() =>
    Boolean(credentials.apiKey || credentials.apiSecret),
  );
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors: fieldErrors, isSubmitting },
  } = useForm<BitkubCredentials, undefined, BitkubCredentials>({
    resolver: zodResolver(bitkubCredentialsSchema),
    defaultValues: credentials,
  });
  const {
    hasConnectionStatus,
    isConnectionUnknown,
    isConnected,
    isConfigured,
  } = getConnectionFlags(connection);
  const isFormBusy = isBusy || isSubmitting;
  const isKeyFormVisible = canShowKeyForm({
    isConnected,
    isConfigured,
    isConnectionUnknown,
    isKeyEntryOpen,
  });
  const toggleKeyEntry = () => setIsKeyEntryOpen((isOpen) => !isOpen);

  const onSubmit = handleSubmit(async (credentials) => {
    const connected = await handleConnect(credentials);
    if (connected) {
      clearCredentials();
      reset({ apiKey: "", apiSecret: "" });
      setIsKeyEntryOpen(false);
    }
  });

  return (
    <SettingsSection
      title="Bitkub"
      description="จัดการ API key สำหรับอ่านประวัติคำสั่งซื้อ BTC/THB เพื่อทำ DCA"
    >
      <div className="text-sm">
        <p>
          สถานะ:{" "}
          {getStatusText({
            isLoading: connection.isLoading,
            isConnectionUnknown,
            isConnected,
            keyHint: connection.data?.keyHint,
          })}
        </p>
      </div>

      <p className="text-muted-foreground text-sm">
        การเชื่อมต่อนี้ผูกกับบัญชีผู้ใช้ที่เข้าสู่ระบบ API key
        ของผู้ใช้แต่ละคนจัดเก็บแยกกันและไม่แชร์ให้ผู้ใช้อื่น
      </p>
      <p className="text-muted-foreground text-sm">
        สร้าง API key ใน Bitkub โดยเลือกสิทธิ์อ่านข้อมูลเท่านั้น แอปใช้ key
        เพื่ออ่านประวัติคำสั่งซื้อ BTC/THB เท่านั้น และไม่อ่านยอดกระเป๋า
        การเชื่อมต่อสำเร็จไม่ได้ยืนยันว่าสิทธิ์ของ key ถูกจำกัดแล้ว
      </p>
      <p className="text-muted-foreground text-sm">
        เมื่อเปลี่ยน key ประวัติที่โหลดไว้ยังคงอยู่และรวมกับประวัติที่โหลดใหม่
        ควรใช้ key จากบัญชี Bitkub เดิมเพื่อเก็บประวัติของบัญชีเดียวกัน
      </p>

      {isConnectionUnknown && (
        <ConnectionUnknownBlock
          connection={connection}
          isKeyEntryOpen={isKeyEntryOpen}
          isFormBusy={isFormBusy}
          onToggleKeyEntry={toggleKeyEntry}
        />
      )}

      {hasConnectionStatus && !connection.data?.configured && (
        <p className="text-sm">
          ระบบยังไม่พร้อมรับการเชื่อมต่อ Bitkub กรุณาติดต่อผู้ดูแล
        </p>
      )}

      {isConnected && (
        <ConnectedActions
          isKeyEntryOpen={isKeyEntryOpen}
          isFormBusy={isFormBusy}
          onToggleKeyEntry={toggleKeyEntry}
          onDisconnect={() => void handleDisconnect()}
        />
      )}

      {isKeyFormVisible && (
        <KeyForm
          isConnected={isConnected}
          isFormBusy={isFormBusy}
          register={register}
          fieldErrors={fieldErrors}
          onSubmit={onSubmit}
          onCredentialChange={updateCredentials}
        />
      )}

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <p role="status" aria-live="polite" className="text-sm">
        {isBusy ? "กำลังดำเนินการ…" : message}
      </p>
    </SettingsSection>
  );
}
