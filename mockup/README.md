# 📱 Mobile Mockup Testing Guide

This folder contains the **Purchase Order Receiving (Goods Receipt)** mockup. It is designed to test the end-to-end flow from a physical worker's perspective (Printing & Scanning) directly against the local backend.

## 🚀 How to Run (Step-by-Step)

### 1. Identify your PC's IP Address
On your Windows machine, run:
```powershell
ipconfig
```
Find your **IPv4 Address** (e.g., `192.168.1.5`). **Memorize this.**

### 2. Host the Mockup Folder
Run this command from inside the `/mockup` folder:
```powershell
npx serve .
```
This will host the files at `http://localhost:3000`.

### 3. Open on your Phone
1.  Ensure your **Phone and PC are on the same Wi-Fi network**.
2.  Open your phone's browser and go to your PC's IP:
    `http://<YOUR_PC_IP>:3000/po_receive_test.html`

---

## 🛠️ Critical Troubleshooting (REQUIRED)

### ⚠️ A. The Camera "Insecure Context" Error
Mobile browsers block camera access unless the site is `HTTPS` or `localhost`. Since you're using a local IP, you **MUST** follow these steps on your phone's Chrome:

1.  Open Chrome and go to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2.  In the text box, type your mockup URL: `http://<YOUR_PC_IP>:3000`
3.  Change the dropdown from **Disabled** to **Enabled**.
4.  Click **Relaunch** at the bottom.

### ⚠️ B. The Backend API Connection
The mockup defaults to `localhost:5000`, but your phone cannot see your PC's `localhost`.
1.  In the mockup UI on your phone, find the **Backend API Base URL** field.
2.  Change it to: `http://<YOUR_PC_IP>:5000/api`
3.  Paste your **JWT Bearer Token** (from Postman/Swagger) into the token box.

### ⚠️ C. Windows Firewall
If your phone says "Connection Timed Out", you likely need to open your Windows Firewall to allow **Ports 3000 and 5000**.
