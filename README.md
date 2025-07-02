# Structra CLI

🚀 **Structra CLI** бол Node.js дээр бүтээгдсэн интерактив CLI хэрэгсэл бөгөөд таны HTML/CSS/JS болон бусад вэб төслүүдэд зориулсан хавтас, файл үүсгэх үйл явцыг автоматжуулдаг.

![version](https://img.shields.io/badge/version-1.1.1-blue)
![status](https://img.shields.io/badge/status-active-brightgreen)
![node](https://img.shields.io/badge/node-%3E%3D16.0.0-lightgrey)

---

## 🧰 Гол боломжууд

- CLI интерфэйсээр төсөл үүсгэх  
- `index.html`, `README.md` автоматаар үүсгэх  
- Төслийн бүтцээ интерактив байдлаар фолдер болон файл хэлбэрээр бүрдүүлэх  
- Үүсгэж буй бүтцийг preview хийх  
- Хамгийн сүүлд ашигласан замыг автоматаар хадгалах  

---

## ⚙️ Суулгах, эхлүүлэх, устгах

```bash
# ✅ Суулгах
cd ~
mkdir structra
cd structra
git clone https://github.com/ab24367010/structra-cli.git
cd structra-cli
npm install
sudo npm install -g .

# ✅ Эхлүүлэх
sudo structra

# ✅ Хуучин хувилбарыг устгах
cd ~
cd structra
sudo npm uninstall -g structra-cli
rm -rf structra-cli
