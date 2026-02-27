export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method;
    
    // CORS
    if (method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // 生成6位验证码
    function generateCode() {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // 解析表单
    async function parseForm(request) {
      const formData = await request.formData();
      const file = formData.get("file");
      const code = formData.get("code") || generateCode();
      return { file, code };
    }

    // 上传页面
    if (url.pathname === "/" && method === "GET") {
      return new Response(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // 上传文件
    if (url.pathname === "/upload" && method === "POST") {
      try {
        const { file, code } = await parseForm(request);
        if (!file) return new Response("No file", { status: 400 });
        
        const key = `${code}/${file.name}`;
        await env.FILESHARE.put(key, file.stream(), {
          customMetadata: {
            code: code,
            created: Date.now().toString(),
          },
        });
        
        return new Response(JSON.stringify({ 
          success: true, 
          code: code,
          downloadUrl: `/download/${code}`
        }), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    // 下载页面
    if (url.pathname.startsWith("/download/")) {
      const code = url.pathname.split("/")[2];
      return new Response(downloadHtml.replace(/\{\{CODE\}\}/g, code), {
        headers: { "Content-Type": "text/html" },
      });
    }

    // 列出文件
    if (url.pathname.startsWith("/list/") && method === "GET") {
      try {
        const code = url.pathname.split("/")[2];
        const list = await env.FILESHARE.list({ prefix: code + "/" });
        const files = list.objects.map(obj => ({
          name: obj.key.split("/")[1],
          size: obj.size,
        }));
        return new Response(JSON.stringify(files));
      } catch (e) {
        return new Response(JSON.stringify([]));
      }
    }

    // 执行下载
    if (url.pathname === "/get" && method === "POST") {
      try {
        const data = await request.json();
        const { code, filename } = data;
        
        const list = await env.FILESHARE.list({ prefix: code + "/" });
        const file = list.objects.find(o => o.key.endsWith(filename));
        
        if (!file) return new Response("File not found", { status: 404 });
        
        const obj = await env.FILESHARE.get(file.key);
        return new Response(obj.body, {
          headers: {
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    // 删除文件（管理员）
    if (url.pathname === "/delete" && method === "POST") {
      try {
        const data = await request.json();
        const { code, filename, adminCode } = data;
        
        if (adminCode !== "ADMIN123") {
          return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
        }
        
        const key = `${code}/${filename}`;
        await env.FILESHARE.delete(key);
        
        return new Response(JSON.stringify({ success: true }));
      } catch (e) {
        return new Response(e.message, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};

const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>文件传输</title>
  <style>
    body { font-family: Arial; max-width: 500px; margin: 50px auto; padding: 20px; }
    .upload { border: 2px dashed #ddd; padding: 30px; text-align: center; border-radius: 10px; }
    input[type="file"] { margin: 20px 0; }
    button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    button:hover { background: #0056b3; }
    .result { margin-top: 20px; padding: 10px; background: #e7f3ff; border-radius: 5px; }
    .delete { margin-top: 20px; }
    .delete input { padding: 8px; width: 100px; }
  </style>
</head>
<body>
  <h2>📤 上传文件</h2>
  <div class="upload">
    <input type="file" id="fileInput">
    <br>
    <button onclick="upload()">上传</button>
  </div>
  <div id="result"></div>
  
  <h2>📥 下载文件</h2>
  <div class="delete">
    <input type="text" id="codeInput" placeholder="验证码">
    <button onclick="goDownload()">去下载</button>
  </div>
  
  <script>
    async function upload() {
      const fileInput = document.getElementById("fileInput");
      if (!fileInput.files[0]) return alert("请选择文件");
      
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);
      
      const res = await fetch("/upload", { method: "POST", body: formData });
      const data = await res.json();
      
      if (data.success) {
        document.getElementById("result").innerHTML = \`
          <div class="result">
            <p>✅ 上传成功！</p>
            <p>验证码：<strong>\${data.code}</strong></p>
            <p>下载链接：<a href="\${data.downloadUrl}">\${data.downloadUrl}</a></p>
          </div>
        \`;
      } else {
        alert("上传失败：" + data.error);
      }
    }
    
    function goDownload() {
      const code = document.getElementById("codeInput").value.trim();
      if (!code) return alert("请输入验证码");
      window.location.href = "/download/" + code;
    }
  </script>
</body>
</html>
`;

const downloadHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>下载文件</title>
  <style>
    body { font-family: Arial; max-width: 500px; margin: 50px auto; padding: 20px; }
    .files { margin: 20px 0; }
    .file { padding: 10px; border: 1px solid #ddd; margin: 5px 0; border-radius: 5px; display: flex; justify-content: space-between; align-items: center; }
    button { background: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; }
    .delete-btn { background: #dc3545; }
    input { padding: 8px; width: 120px; margin-right: 10px; }
  </style>
</head>
<body>
  <h2>📥 下载文件</h2>
  <p>验证码：<strong>{{CODE}}</strong></p>
  <div id="files" class="files">加载中...</div>
  
  <h3>🗑️ 删除文件（管理员）</h3>
  <div style="display: flex;">
    <input type="password" id="adminCode" placeholder="管理员码">
    <button class="delete-btn" onclick="deleteFile()">删除选中</button>
  </div>
  
  <script>
    let files = [];
    let currentCode = "{{CODE}}";
    
    async function loadFiles() {
      try {
        const res = await fetch("/list/" + currentCode);
        files = await res.json();
        
        if (files.length === 0) {
          document.getElementById("files").innerHTML = "<p>暂无文件</p>";
          return;
        }
        
        document.getElementById("files").innerHTML = files.map((f, i) => \`
          <div class="file">
            <span>\${f.name} (\${(f.size/1024).toFixed(1)} KB)</span>
            <div>
              <button onclick="download(\${i})">下载</button>
            </div>
          </div>
        \`).join("");
      } catch (e) {
        document.getElementById("files").innerHTML = "<p>加载失败</p>";
      }
    }
    
    function download(i) {
      const f = files[i];
      fetch("/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: currentCode, filename: f.name })
      }).then(res => {
        if (res.ok) {
          res.blob().then(blob => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = f.name;
            a.click();
          });
        } else {
          alert("下载失败");
        }
      });
    }
    
    async function deleteFile() {
      const adminCode = document.getElementById("adminCode").value;
      const selected = files.filter(() => false); // 这里简化，实际应用中应该让用户选择要删除的文件
      
      if (files.length === 0) return alert("没有文件可删除");
      if (adminCode !== "ADMIN123") return alert("管理员码错误");
      
      // 删除所有文件
      for (const f of files) {
        await fetch("/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: currentCode, filename: f.name, adminCode })
        });
      }
      
      alert("删除成功");
      loadFiles();
    }
    
    loadFiles();
  </script>
</body>
</html>
`;
