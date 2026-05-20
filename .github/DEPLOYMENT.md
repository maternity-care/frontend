# Hướng dẫn Setup CI/CD — Frontend

## Lưu ý quan trọng về Next.js

Các biến `NEXT_PUBLIC_*` được Next.js **inline vào JavaScript bundle ở BUILD TIME**, không phải runtime.
→ Phải truyền chúng vào lúc `docker build` (qua `--build-arg`), không thể đặt trong `.env` trên VPS rồi mong chúng hoạt động.

Workflow này dùng **GitHub Variables** (không phải Secrets) để bạn dễ đổi URL khi có domain.

---

## Bước 1: Setup VPS (1 lần)

SSH vào VPS:

```bash
# Tạo network nếu chưa có (dùng chung với backend + infrastructure)
docker network create maternity_care_system_g44 2>/dev/null || true

# Tạo thư mục deploy
sudo mkdir -p /opt/maternity/frontend
sudo chown $USER:$USER /opt/maternity/frontend
cd /opt/maternity/frontend

# Tạo .env (runtime vars, không phải NEXT_PUBLIC_*)
nano .env
```

Nội dung `.env`:
```env
NODE_ENV=production
PORT=3000
```

> `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_SITE_URL` KHÔNG đặt ở đây — chúng nằm trong GitHub Variables (xem Bước 3).

Mở firewall:
```bash
sudo ufw allow 3000/tcp
```

---

## Bước 2: Add 3 Secrets vào GitHub

Vào: `https://github.com/maternity-care/frontend/settings/secrets/actions`

| Name | Value |
|------|-------|
| `SERVER_HOST` | IP VPS |
| `SERVER_USER` | `root` |
| `SERVER_SSH_KEY` | Private SSH key (dùng chung với backend) |

> Có thể dùng lại cùng SSH key đã tạo cho backend deployment.

---

## Bước 3: Add 2 Variables vào GitHub

Vào: `https://github.com/maternity-care/frontend/settings/variables/actions`

Bấm tab **Variables** → **New repository variable**

| Name | Value (vd) |
|------|-----------|
| `NEXT_PUBLIC_API_URL` | `http://<VPS_IP>:84` (đổi sang `https://api.your-domain.com` khi có domain) |
| `NEXT_PUBLIC_SITE_URL` | `http://<VPS_IP>:3000` (đổi sang `https://your-domain.com` khi có domain) |

> Sau này có domain, vào đây sửa Variables và re-run workflow. Không cần sửa code.

---

## Bước 4: Enable Workflow Permissions

`https://github.com/maternity-care/frontend/settings/actions`

**Workflow permissions** → ✅ **Read and write permissions** → Save

---

## Bước 5: Push & trigger

```powershell
cd C:\Users\Admin\Desktop\SEP490\frontend
git add .
git commit -m "ci: setup deploy workflow"
git push origin main
```

Vào Actions xem progress. Lần đầu job `deploy` sẽ **fail** vì GHCR Private.

---

## Bước 6: Set GHCR Public

Sau khi job `build` ✅:

`https://github.com/maternity-care/frontend/pkgs/container/frontend`

- Cột phải → **Package settings**
- Cuối trang → **Danger Zone** → **Change visibility** → **Public**

---

## Bước 7: Re-run

Actions → workflow fail → **Re-run failed jobs**

---

## Bước 8: Verify

SSH vào VPS:
```bash
docker ps                                  # maternity-frontend Up
docker logs maternity-frontend --tail 30   # phải thấy "Ready in ..."
curl http://localhost:3000                 # phải trả HTML
```

Browser: `http://<VPS_IP>:3000`

---

## Khi đổi domain sau này

1. Vào `Settings → Secrets and variables → Actions → Variables`
2. Sửa `NEXT_PUBLIC_API_URL` và `NEXT_PUBLIC_SITE_URL`
3. Vào Actions → workflow gần nhất → **Re-run all jobs** (để rebuild với URL mới)

> ⚠️ KHÔNG dùng "Re-run failed jobs" — phải re-run cả `build` job để image được rebuild với URL mới.

---

## Troubleshooting

### Build fail ở `npm install` 
- Có thể do `package-lock.json` không tương thích Node 22. Thử `npm install` local trước.

### Build OK nhưng app gọi sai API URL
- Check Variables đã set đúng chưa
- Re-run cả 2 jobs (vì NEXT_PUBLIC_* đã inline vào bundle cũ)

### Container start nhưng không serve được
- Check log: `docker logs maternity-frontend --tail 50`
- Có thể thiếu file `.next/standalone/server.js` → build standalone không thành công
- Check `next.config.ts` phải có `output: "standalone"`

### Lỗi `getaddrinfo ENOTFOUND` khi frontend gọi API
- Nếu URL là tên container (vd `http://maternity-api:84`) thì chỉ work khi cùng network và gọi từ server-side
- Browser request thì URL phải là public URL (`http://VPS_IP:84` hoặc domain)
- Nói chung dùng public URL (`http://<VPS_IP>:84`) là an toàn nhất

---

## Manual deploy

```bash
ssh root@<VPS_IP>
cd /opt/maternity/frontend
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```
