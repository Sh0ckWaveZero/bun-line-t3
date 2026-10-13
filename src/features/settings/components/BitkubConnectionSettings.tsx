import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBitkubConnection } from "@/features/exchanges/hooks/useBitkubConnection";
import {
  bitkubCredentialsSchema,
  type BitkubCredentials,
} from "@/features/exchanges/lib/bitkub-credentials";
import { useBitkubCredentialDraft } from "@/features/settings/lib/bitkub-credential-draft-context";
import { SettingsSection } from "./SettingsSection";

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
  const hasConnectionStatus = Boolean(connection.data) && !connection.isError;
  const isConnectionUnknown = connection.isError;
  const isConnected = hasConnectionStatus && connection.data?.connected;
  const isConfigured = hasConnectionStatus && connection.data?.configured;
  const isFormBusy = isBusy || isSubmitting;
  const canShowKeyForm = isConnected
    ? isKeyEntryOpen
    : isConfigured || (isConnectionUnknown && isKeyEntryOpen);

  const onSubmit = handleSubmit(async (credentials) => {
    const connected = await handleConnect(credentials);
    if (connected) {
      clearCredentials();
      reset({ apiKey: "", apiSecret: "" });
      setIsKeyEntryOpen(false);
    }
  });
  const apiKeyField = register("apiKey");
  const apiSecretField = register("apiSecret");

  return (
    <SettingsSection
      title="Bitkub"
      description="จัดการ API key สำหรับอ่านประวัติคำสั่งซื้อ BTC/THB เพื่อทำ DCA"
    >
      <div className="text-sm">
        <p>
          สถานะ:{" "}
          {connection.isLoading
            ? "กำลังตรวจสอบการเชื่อมต่อ"
            : isConnectionUnknown
              ? "ตรวจสอบไม่ได้"
              : isConnected
                ? `เชื่อมต่อแล้ว ${connection.data?.keyHint ?? ""}`
                : "ยังไม่ได้เชื่อมต่อ"}
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
            <Button
              type="button"
              variant="outline"
              disabled={isFormBusy}
              aria-expanded={isKeyEntryOpen}
              aria-controls="settings-bitkub-key-form"
              onClick={() => setIsKeyEntryOpen((isOpen) => !isOpen)}
            >
              {isKeyEntryOpen ? "ซ่อนช่องกรอก API Key" : "กรอก API Key"}
            </Button>
          </div>
        </div>
      )}

      {hasConnectionStatus && !connection.data?.configured && (
        <p className="text-sm">
          ระบบยังไม่พร้อมรับการเชื่อมต่อ Bitkub กรุณาติดต่อผู้ดูแล
        </p>
      )}

      {isConnected && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isFormBusy}
            aria-expanded={isKeyEntryOpen}
            aria-controls="settings-bitkub-key-form"
            onClick={() => setIsKeyEntryOpen((isOpen) => !isOpen)}
          >
            {isKeyEntryOpen ? "ซ่อนช่องกรอก API Key" : "เปลี่ยน API Key"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isFormBusy}
            onClick={() => void handleDisconnect()}
          >
            ยกเลิกการเชื่อมต่อ
          </Button>
        </div>
      )}

      {canShowKeyForm && (
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
                  updateCredentials({ apiKey: value });
                }}
                aria-invalid={Boolean(fieldErrors.apiKey)}
                aria-describedby={
                  fieldErrors.apiKey
                    ? "settings-bitkub-api-key-error"
                    : undefined
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
                  updateCredentials({ apiSecret: value });
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
