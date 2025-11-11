Backend structure mirror

This backend now mirrors the directory layout of `flashmonitor__node-main/packages` while preserving your existing Python backend files.

Created directories under `backend/packages`:
- context/
  - Debug/
  - Session/
  - Utility/
- cron/
- dyna_modules/
  - Cache/
  - FileManager/
- iife/
- middleware/
  - Debug/
- routes/
  - Account/
  - Platform/
  - __scalar__/
    - Csv/
    - Image/
    - Percentage/
- tag/
  - Account/
  - RoutePlan/
  - Session/
  - Smpp/
  - Sms/
  - SystemInformation/
  - Vendor/
- www/
  - http/

Notes:
- Only directories and simple READMEs were added; no Node/JS files were copied.
- You can now place Python modules mirroring the same logical boundaries.
- If you prefer a Node.js backend with pnpm workspaces like `flashmonitor__node-main`, let me know and I can scaffold it safely alongside or within `backend/`.
