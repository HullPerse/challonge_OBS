export type ServerSettings = {
  port: number;
  vite_port: number;
  open_browser: boolean;
  db_path: string;
};

export type SettingsSaveResult =
  | { ok: true; settings: ServerSettings }
  | { ok: false; error: Error };
