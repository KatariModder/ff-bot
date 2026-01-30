let randomRunning = false;
let randomUserId = null;
let randomUserTag = null;
let randomStop = false;
let randomMessage = null;

import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";

import fetch from "node-fetch";

import dotenv from "dotenv";

import schedule from "node-schedule";

import fs from "fs";

import path from "path";

import axios from "axios";

import express from "express";

dotenv.config();

process.env.TZ = "Asia/Ho_Chi_Minh"; // 🕒 Ép múi giờ Việt Nam

const TOKEN = process.env.TOKEN;

const PREFIX = "!";

const client = new Client({

  intents: [

    GatewayIntentBits.Guilds,

    GatewayIntentBits.GuildMessages,

    GatewayIntentBits.MessageContent,

  ],

});

client.once("ready", () => {

  console.log(`✅ Bot đã đăng nhập: ${client.user.tag}`);

});

// ==================== GIF CHUNG ====================

const loadingGIF = "https://media.tenor.com/On7kvXhzml4AAAAj/loading-gif.gif";

// ==================== DANH SÁCH ADMIN ====================

const admins = ["981937497359675494"]; // Chỉ bạn là admin

// ==================== FILE LƯU DANH SÁCH AUTOLIKE ====================

const DATA_PATH = path.join(process.cwd(), "autolike.json");

let autoLikeList = [];

// Load danh sách khi bot khởi động

try {

  if (fs.existsSync(DATA_PATH)) {

    const data = fs.readFileSync(DATA_PATH, "utf-8");

    autoLikeList = JSON.parse(data);

  }

} catch (err) {

  console.error("Không thể load danh sách autolike:", err);

}

// Lưu danh sách vào file

function saveAutoLikeList() {

  try {

    fs.writeFileSync(DATA_PATH, JSON.stringify(autoLikeList, null, 2), "utf-8");

  } catch (err) {

    console.error("Không thể lưu danh sách autolike:", err);

  }

}

// ==================== RESET AUTOLIKE HÀNG NGÀY ====================

function resetAutoLikeList() {

  console.log("🔄 Reset trạng thái autolike cho tất cả UID (23:30 VN)...");

  // Nếu muốn xóa toàn bộ UID để reset lượt buff, bỏ comment dòng dưới

  // autoLikeList = [];

  saveAutoLikeList();

}

// ==================== LỊCH RESET UID HÀNG NGÀY ====================

// 23:30 VN

schedule.scheduleJob("30 23 * * *", () => {

  resetAutoLikeList();

});

// ==================== AUTOLIKE TỰ ĐỘNG ====================

let autoLikeJob = null;

function startAutoLike() {

  if (autoLikeJob) return false;

  // 23:50 VN

autoLikeJob = schedule.scheduleJob("50 23 * * *", async () => {

    if (!autoLikeList.length) return;

    const results = [];

    const startTime = Date.now();

    for (let i = 0; i < autoLikeList.length; i += 10) {

      const batch = autoLikeList.slice(i, i + 10);

      const batchResults = await Promise.all(batch.map((uid) => buffLikeUID(uid)));

      results.push(...batchResults);

    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const channel = client.channels.cache.get("1421386678416838698"); // ID kênh thông báo

    if (!channel) return;

    for (let i = 0; i < results.length; i += 10) {

      const embed = new EmbedBuilder().setTitle("💗 Autolike Kết quả").setColor("Blue");

      const batch = results.slice(i, i + 10);

      let desc = "";

      batch.forEach((r) => {

        if (r.success) {

          desc += `👤 UID: ${r.uid} | Likes Trước: ${r.likesBefore} | Likes Sau: ${r.likesAfter} | API: ${r.apiLikes}\n`;

        } else {

          desc += `👤 UID: ${r.uid} | ⚠️ ${r.reason}\n`;

        }

      });

      desc += `⏱️ Thời gian xử lý: ${elapsed}s`;

      embed.setDescription(desc);

      channel.send({ embeds: [embed] });

    }

  });

  return true;

}

function stopAutoLike() {

  if (!autoLikeJob) return false;

  autoLikeJob.cancel();

  autoLikeJob = null;

  return true;

}

// ==================== HÀM KIỂM TRA ADMIN ====================

function checkAdmin(msg) {

  if (!admins.includes(msg.author.id)) {

    msg.reply("❌ Bạn không có quyền sử dụng lệnh này!");

    return false;

  }

  return true;

}

// ==================== MESSAGE HANDLER ====================

client.on("messageCreate", async (msg) => {

  if (msg.author.bot || !msg.content.startsWith(PREFIX)) return;

  const args = msg.content.slice(PREFIX.length).trim().split(/ +/);

  const command = args.shift()?.toLowerCase();

  // ======= LỆNH KATARI HELP =======
if (command === "katari") {
  if (!args[0] || args[0].toLowerCase() !== "help") {
    const warningMsg = await msg.reply("❌ Sai cú pháp! Dùng lệnh đúng: `!katari help`");
    setTimeout(async () => {
      try {
        await msg.delete().catch(() => {});
        await warningMsg.delete().catch(() => {});
      } catch {}
    }, 10000);
    return;
  }

  const loadingMsg = await msg.reply("⏳ Đang tải danh sách lệnh...");

  setTimeout(async () => {
    const colors = ["Blue", "Aqua", "Green", "Purple", "Gold", "Red"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const icons = ["⚙️", "💗", "💥", "🔥", "🚀", "🧠", "🌟"];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];

    const embed = new EmbedBuilder()
      .setTitle(`${randomIcon} DANH SÁCH LỆNH NGƯỜI DÙNG ${randomIcon}`)
      .setColor(randomColor)
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`💡 Tiền tố lệnh: \`!\`\n\nDưới đây là toàn bộ lệnh người dùng:`)
      .addFields([
        {
          name: "💗 LỆNH NGƯỜI DÙNG (1)",
          value: `
**!like <UID>**
> Buff like ngay lập tức cho UID được chỉ định.
> 🧩 Ví dụ: \`!like 12345678\`

**!info <UID>**
> Lấy thông tin chi tiết người chơi (rank, clan, region...).
> 🧩 Ví dụ: \`!info 12345678\`

**!check <UID>**
> Kiểm tra UID có bị ban hay không.
> 🧩 Ví dụ: \`!check 12345678\`

**!visit <region> <UID>**
> Tăng lượt xem cho tài khoản thông qua API visit.
> 🧩 Ví dụ: \`!visit vn 12345678\`

**!spam <UID>**
> Gửi lời mời liên tục đến người chơi.
> 🧩 Ví dụ: \`!spam 12345678\`
`,
          inline: false
        },
        {
          name: "💗 LỆNH NGƯỜI DÙNG (2)",
          value: `
**!ghost <TEAMCODE>**
> Bóng ma troll người khác trong tổ đội.
> 🧩 Ví dụ: \`!ghost 1234567\`

**!team5,6 <UID>**
> Tạo team5,6.
> 🧩 Ví dụ: \`!team5 12345678\`

**!lag <TEAMCODE>**
> Làm lag teamcode người chơi.
> 🧩 Ví dụ: \`!lag 1234567\`

**!emote <TEAMCODE> <UID> <EMOTEID hoặc TÊN>**
> Sử dụng các hành động bất kỳ.
> 🧩 Ví dụ: \`!emote 1234567 12345678 90945678 & ak47\`

**!emotes <TEAMCODE> <UID1> <UID2> <UID3> <UID4> <EMOTEID hoặc TÊN>**
> Sử dụng các hành động bất kỳ.
> 🧩 Ví dụ: \`!emotes 1234567 12345678 123456789 12345678910 1234567891011\`
`,
          inline: false
        },
        {
          name: "💗 LỆNH NGƯỜI DÙNG (3)",
          value: `
**!bio <TOKEN> <newbio>**
> Để tiểu sử dài.
> 🧩 Ví dụ: \`!bio e02fa9.. memaybeo\`

**!get <TOKEN>**
> Chuyển token sang jwt.
> 🧩 Ví dụ: \`!get e02fa9800390..\`
`,
          inline: false
        },
        {
          name: "ℹ️ THÔNG TIN KHÁC",
          value: `
📦 Phiên bản bot: **v4.0.0**

💬 Gõ \`!katari help\` bất kỳ lúc nào để xem lại danh sách lệnh.
`,
          inline: false
        }
      ])
      .setFooter({
        text: `Bot tổng hợp • Dev: Katari 📌 • ${new Date().toLocaleString("vi-VN")}`,
        iconURL: client.user.displayAvatarURL()
      });

    await loadingMsg.edit({
      content: "✅ Danh sách lệnh sẵn sàng!",
      embeds: [embed]
    });
  }, 1500);
}

  // ======= LỆNH AUTOLIKE =======

  if (command === "autolike") {

    if (!checkAdmin(msg)) return;

    if (!args.length) return msg.reply("❌ Cú pháp: `!autolike <UID1 UID2 ...>` hoặc `!autolike list`");

    if (args[0].toLowerCase() === "list") {

      if (!autoLikeList.length) return msg.reply("📋 Danh sách autolike trống!");

      return msg.reply({ embeds: [{ title: "📋 Danh sách UID autolike", description: autoLikeList.join("\n"), color: 0x0000ff }] });

    }

    const newUIDs = args.filter((uid) => !isNaN(uid));

    const addedUIDs = [];

    newUIDs.forEach((uid) => {

      if (!autoLikeList.includes(uid)) {

        autoLikeList.push(uid);

        addedUIDs.push(uid);

      }

    });

    if (addedUIDs.length) saveAutoLikeList();

    return msg.reply({

      embeds: [{

        title: "💗 Autolike Updated",

        description: addedUIDs.length ? `✅ Thêm thành công:\n${addedUIDs.join("\n")}` : "⚠️ UID đã tồn tại hoặc không hợp lệ",

        color: 0x00ff00

      }]

    });

  }

  // ======= LỆNH REMOVEAUTOLIKE =======

  if (command === "removeautolike") {

    if (!checkAdmin(msg)) return;

    if (!args.length) return msg.reply("❌ Cú pháp: `!removeautolike <UID1 UID2 ...>`");

    const removedUIDs = [];

    args.forEach((uid) => {

      const index = autoLikeList.indexOf(uid);

      if (index !== -1) {

        autoLikeList.splice(index, 1);

        removedUIDs.push(uid);

      }

    });

    if (removedUIDs.length) saveAutoLikeList();

    return msg.reply({

      embeds: [{

        title: "🗑️ Remove Autolike",

        description: removedUIDs.length ? `✅ Xóa thành công:\n${removedUIDs.join("\n")}` : "⚠️ UID không có trong danh sách",

        color: 0xff0000

      }]

    });

  }

  // ======= LỆNH RUNAUTOLIKE =======

  if (command === "runautolike") {

    if (!checkAdmin(msg)) return;

    if (!autoLikeList.length) return msg.reply("⚠️ Danh sách autolike trống!");

 

    const processing = await msg.reply("🚀 Đang chạy autolike ngay bây giờ...");

 

    const results = [];

    const startTime = Date.now();

 

    for (let i = 0; i < autoLikeList.length; i += 10) {

      const batch = autoLikeList.slice(i, i + 10);

      const batchResults = await Promise.all(batch.map((uid) => buffLikeUID(uid)));

      results.push(...batchResults);

    }

 

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

 

    for (let i = 0; i < results.length; i += 10) {

      const embed = new EmbedBuilder()

        .setTitle("💗 Kết quả RunAutoLike")

        .setColor("Blue");

 

      const batch = results.slice(i, i + 10);

      let desc = "";

      batch.forEach((r) => {

        if (r.success) {

          desc += `👤 UID: ${r.uid} | Likes Trước: ${r.likesBefore} | Likes Sau: ${r.likesAfter} | API: ${r.apiLikes}\n`;

        } else {

          desc += `👤 UID: ${r.uid} | ⚠️ ${r.reason}\n`;

        }

      });

      desc += `⏱️ Thời gian xử lý: ${elapsed}s`;

      embed.setDescription(desc);

 

      await processing.edit({ content: null, embeds: [embed] });

    }

  }

  // ======= LỆNH LIKE =======
if (command === "like") {
  const uid = args[0];

  if (!uid || isNaN(uid)) {
    const warn = await msg.reply(
      "❌ Sai cú pháp!\n\nVí dụ:\n```bash\n!like 12345678\n```"
    );

    setTimeout(() => {
      warn.delete().catch(() => {});
      msg.delete().catch(() => {});
    }, 3000);
    return;
  }

  const processing = await msg.reply(
    `⏳ Đang buff like cho UID **${uid}**...`
  );

  try {
    const apiUrl = `https://ffcommunityapilvupaya.spcfy.eu/likes?uid=${uid}`;
    const res = await fetch(apiUrl);
    const data = await res.json();

    const result = data?.result;

    // ===== THÀNH CÔNG =====
    if (result?.API?.Success === true) {
      const embed = new EmbedBuilder()
        .setTitle("✅ BUFF LIKE THÀNH CÔNG")
        .setColor("Green")
        .setDescription(
          `> **Tên người chơi:** ${result["User Info"]?.["Account Name"] || "Không rõ"}\n` +
          `> **UID:** ${result["User Info"]?.["Account UID"] || uid}\n` +
          `> **Like trước:** ${result["Likes Info"]?.["Likes Before"]}\n` +
          `> **Like thêm:** +${result["Likes Info"]?.["Likes Added"]}\n` +
          `> **Like sau:** ${result["Likes Info"]?.["Likes After"]}`
        )
        .setThumbnail(
          msg.author.displayAvatarURL({ dynamic: true, size: 256 })
        )
        .setFooter({ text: "DEVELOPED BY KATARI" })
        .setTimestamp();

      await processing.edit({ content: null, embeds: [embed] });

    // ===== MAX LIKE / RATE LIMIT =====
    } else {
      const errMsg = await processing.edit(
        "⚠️ UID này đã **MAX LIKE**.\n> Vui lòng quay lại **ngày mai** để buff tiếp."
      );

      setTimeout(() => {
        errMsg.delete().catch(() => {});
      }, 10000);
    }

  } catch (err) {
    console.error(err);

    const errMsg = await processing.edit(
      "❌ Lỗi kết nối API Like."
    );

    setTimeout(() => {
      errMsg.delete().catch(() => {});
    }, 10000);
  }
}
// ======= HẾT LỆNH LIKE =======

  // ======= LỆNH INFO =======
if (command === "info") {
  const uid = args[0];
  if (!uid || isNaN(uid)) return;

  const processing = await msg.reply({
    content: `⏳ Đang lấy thông tin người chơi **${uid}**...`,
    files: [loadingGIF],
  });

  const start = Date.now();

  try {
    const embed = await getFullInfoEmbed(uid, msg.author);
    const elapsed = ((Date.now() - start) / 1000).toFixed(2);
    embed.addFields({ name: "⏱️ Thời gian xử lý", value: `${elapsed}s`, inline: true });

    // Gửi embed text
    await processing.edit({ content: null, embeds: [embed], files: [] });

    // ✅ Outfit API mới (KHÔNG sửa gì khác)
    const outfitImg = `https://outfit.sukhdaku.qzz.io/api/v1/profile?uid=${uid}&bg=3`;
    await msg.channel.send({
      embeds: [{ image: { url: outfitImg } }]
    });

  } catch (err) {
    console.error(err);
    processing.edit({ content: "⚠️ Không thể lấy dữ liệu người chơi!", files: [] });
  }
}

  // ======= LỆNH CHECK =======
if (command === "check") {
  const uid = args[0];
  if (!uid || isNaN(uid)) return;

  const processing = await msg.reply({
    content: `🔍 Đang kiểm tra UID **${uid}**...`,
    files: [loadingGIF]
  });

  try {
    // ===== API CHECK BAN =====
    const resCheck = await fetch(`https://s7sallapis.vercel.app/checkban/${uid}`);
    const dataCheck = await resCheck.json();
    const isBanned = dataCheck?.result?.is_banned === true;

    // ===== API INFO =====
    const resInfo = await fetch(`https://bimoallapis.vercel.app/all/${uid}`);
    let region = "N/A", lastLogin = "N/A", nickname = "N/A";

    if (resInfo.ok) {
      const dataInfo = await resInfo.json();
      const basic = dataInfo?.result?.basic_info || {};
      nickname = basic.nickname || "N/A";
      region = basic.region || "N/A";
      lastLogin = formatTimestamp(basic.last_login_at, "HH:mm:ss dd/MM/yyyy");
    }

    // ===== NỘI DUNG =====
    const description = isBanned
      ? `> **Lý do:** Tài khoản này đã được xác nhận sử dụng phần mềm gian lận (pmt3)
> **Thời gian bị cấm:** Vĩnh viễn
> **Biệt danh:** ${nickname}
> **UID:** ${uid}
> **Lần cuối đăng nhập:** ${lastLogin}
> **Khu vực:** ${region}`
      : `> **Trạng thái:** Không phát hiện gian lận (pmt3)
> **Biệt danh:** ${nickname}
> **UID:** ${uid}
> **Lần cuối đăng nhập:** ${lastLogin}
> **Khu vực:** ${region}`;

    const embed = new EmbedBuilder()
      .setTitle(isBanned ? "⛔ Người chơi bị CẤM" : "✅ Người chơi an toàn")
      .setColor(isBanned ? "Red" : "Green")
      .setDescription(description)

      // 👉 AVATAR DISCORD GÓC PHẢI (GIỐNG HÀM INFO)
      .setThumbnail(
        msg.author.displayAvatarURL({ dynamic: true, size: 256 })
      )

      .setImage(
        isBanned
          ? "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253290639370/standard-1.gif"
          : "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253886361610/standard-2.gif"
      )
      .setFooter({ text: "Dev: Katari 📌" });

    await processing.edit({ content: null, embeds: [embed], files: [] });

  } catch (err) {
    console.error(err);
    processing.edit({
      content: "🚫 Không thể kiểm tra người chơi!",
      files: []
    });
  }
}

  // ======= LỆNH VISIT =======

if (command === "visit") {

  if (args.length < 2)

    return msg.reply("❌ Dùng đúng cú pháp: `!visit [region] [UID]`");

  const region = args[0];

  const uid = args[1];

  const apiUrl = `https://visit-api-xnxx.vercel.app/visit?region=${region}&uid=${uid}`;

  const startTime = Date.now();

  // Gửi message loading (không kèm GIF)

  let loading;

  try {

    loading = await msg.reply(`🌍 Đang tăng lượt xem cho UID **${uid}**...`);

  } catch (err) {

    console.log("Không thể gửi message loading:", err.message);

    loading = null; // tiếp tục xử lý mà không có message loading

  }

  try {

    const res = await fetch(apiUrl);

    if (!res.ok) throw new Error("API không phản hồi.");

    const data = await res.json();

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const success = !data.error && data.success > 0;

    const embed = new EmbedBuilder()

      .setTitle(success ? "✅ Visit thành công!" : "❌ Visit thất bại")

      .setColor(success ? 0x00ff00 : 0xff0000)

      .setThumbnail(

        success

          ? "https://cdn-icons-png.flaticon.com/512/190/190411.png"

          : "https://cdn-icons-png.flaticon.com/512/463/463612.png"

      )

      .setTimestamp();

    let desc = `

👤 UID: ${data.uid || uid}

👤 Tên nhân vật: ${data.nickname || "N/A"}

🌍 Khu vực: ${data.region || region}

⭐ Cấp độ: ${data.level || "N/A"}

❤️ Lượt thích: ${data.likes || 0}

✅ Thành công: ${data.success || 0}

❌ Thất bại: ${data.fail || 0}

⏱️ Thời gian xử lý: ${elapsed}s

📌 Dev: Katari

`;

    embed.setDescription(desc);

    // Chỉ edit nếu message loading còn tồn tại

    if (loading) {

      try {

        await loading.edit({ content: null, embeds: [embed] });

      } catch (err) {

        console.log("Không thể edit message:", err.message);

        await msg.reply({ embeds: [embed] }); // fallback gửi mới

      }

    } else {

      await msg.reply({ embeds: [embed] }); // fallback gửi mới

    }

  } catch (err) {

    const errEmbed = new EmbedBuilder()

      .setTitle("🚫 Lỗi khi gọi API Visit")

      .setDescription(`Chi tiết: \`${err.message}\``)

      .setColor(0xff0000);

    if (loading) {

      try {

        await loading.edit({ content: null, embeds: [errEmbed] });

      } catch {

        await msg.reply({ embeds: [errEmbed] });

      }

    } else {

      await msg.reply({ embeds: [errEmbed] });

    }

  }

}

      // ======= LỆNH BIO MỚI (CHỈ TOKEN HOẶC JWT) =======
if (command === "bio") {
  const token = args[0];
  const newBio = args.slice(1).join(" ");

     // Xóa tin nhắn người dùng sau 1s
    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 1000);

  if (!token || !newBio) {
    const warn = await msg.reply("❌ Sai cú pháp! Dùng: `!bio token newbio`");
    setTimeout(() => {
      msg.delete().catch(() => {});
      warn.delete().catch(() => {});
    }, 2000);
    return;
  }

  // --- Kiểm tra token đã là JWT ---
  if (token.length < 50 || !token.includes('.')) { // token ngắn hoặc không có dấu '.' → chưa lấy JWT
    const warnEmbed = new EmbedBuilder()
      .setColor("#ffcc00")
      .setDescription(
        `⚠️ Token chưa được lấy JWT! Vui lòng get JWT trước khi dùng.\nLấy JWT tại kênh <#1438791394423476337> bằng cú pháp: \`!get token\``
      )
      .setFooter({ text: "Dev Katari 📌" });
    const warnMsg = await msg.channel.send({ embeds: [warnEmbed] });
    setTimeout(() => {
      msg.delete().catch(() => {});
      warnMsg.delete().catch(() => {});
    }, 15000); // Xóa sau 15s
    return;
  }

  const loadingMsg = await msg.reply("⏳ Đang cập nhật bio...");

  try {
    // --- Gửi trực tiếp token (JWT) đến API ---
    const urlUpdate = `https://change-to-bio.vercel.app/updatebio?token=${encodeURIComponent(token)}&bio=${encodeURIComponent(newBio)}`;
    const resUpdate = await fetch(urlUpdate);
    const dataUpdate = await resUpdate.json();

    if (dataUpdate?.status !== "success") {
      const errEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(`⚠️ Lỗi khi cập nhật bio: ${dataUpdate?.message || "❌ Cập nhật thất bại!"}`)
        .setFooter({ text: "Dev Katari 📌" });
      const errMsg = await msg.channel.send({ embeds: [errEmbed] });
      setTimeout(() => {
        msg.delete().catch(() => {});
        errMsg.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
      }, 2000);
      return;
    }

    // --- Thành công ---
    const successEmbed = new EmbedBuilder()
      .setColor("#00ff80")
      .setTitle("✅ Bio đã được cập nhật thành công!")
      .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL({ dynamic: true }) })
      .addFields({ name: "📝 Bio mới", value: `||${dataUpdate.bio_sent}||` })
      .setFooter({ text: "Dev Katari 📌" })
      .setTimestamp();

    await msg.channel.send({ content: `<@${msg.author.id}>`, embeds: [successEmbed] });

    setTimeout(() => {
      msg.delete().catch(() => {});
      loadingMsg.delete().catch(() => {});
    }, 2000);

  } catch (err) {
    console.error(err);
    const errEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setDescription("❌ Có lỗi khi kết nối đến API hoặc token không hợp lệ!")
      .setFooter({ text: "Dev Katari 📌" });
    const errMsg = await msg.channel.send({ embeds: [errEmbed] });
    setTimeout(() => {
      msg.delete().catch(() => {});
      errMsg.delete().catch(() => {});
      loadingMsg.delete().catch(() => {});
    }, 2000);
  }
}

   // ======= LỆNH GET JWT =======
if (command === "get") {
  const token = args[0];

  setTimeout(() => {
    msg.delete().catch(() => {});
  }, 1000);

  if (!token) {
    const warn = await msg.reply("❌ Sai cú pháp! Dùng: !get <eat>");
    setTimeout(() => {
      msg.delete().catch(() => {});
      warn.delete().catch(() => {});
    }, 5000);
    return;
  }

  const loadingMsg = await msg.reply("⏳ Đang lấy JWT từ EAT...");

  try {
    // 🔥 API MỚI
    const jwtRes = await fetch(
      `https://danger-access-token.vercel.app/eat-to-jwt?eat_token=${encodeURIComponent(token)}`
    );
    const jwtData = await jwtRes.json();

    if (!jwtData?.jwt_token) {
      const errEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription("❌ Không lấy được JWT! Vui lòng kiểm tra lại EAT.")
        .setFooter({ text: "Dev Katari 📌" });

      const errMsg = await msg.channel.send({ embeds: [errEmbed] });
      setTimeout(() => {
        msg.delete().catch(() => {});
        errMsg.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
      }, 2000);
      return;
    }

    // ✅ LẤY TỪ ey → TRƯỚC DẤU "
    const jwt = jwtData.jwt_token.match(/ey[^"]+/)?.[0];

    if (!jwt) {
      throw new Error("JWT parse failed");
    }

    // --- Gửi DM ---
    try {
      const dmEmbed = new EmbedBuilder()
  .setColor("#00ff80")
  .setTitle("✅ JWT của bạn")
  .setDescription(
    `Chúc mừng! Bạn đã lấy JWT thành công.\n\n` +
    `Sử dụng cú pháp cập nhật bio:\n` +
    `\`!bio <jwt> <newbio>\`\n\n` +
    `➡️ Dùng lệnh bio ở kênh: <#1450085921633468416>`
  )
  .addFields({ name: "JWT", value: jwt })
  .setFooter({ text: "Dev Katari 📌" })
  .setTimestamp();

      await msg.author.send({ embeds: [dmEmbed] });

      const announceChannel = await msg.guild.channels.fetch("1450085870534262895");
      if (announceChannel) {
        announceChannel.send(
          `<@${msg.author.id}>, bạn hãy check tin nhắn riêng để lấy **JWT** ✅`
        );
      }

      setTimeout(() => {
        msg.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
      }, 2000);

    } catch (dmErr) {
      console.error(dmErr);
      await msg.channel.send("❌ Không thể gửi DM, hãy bật tin nhắn riêng.");
    }

  } catch (err) {
    console.error(err);
    await msg.channel.send("❌ Lỗi kết nối API hoặc EAT không hợp lệ!");
  }
}

   // ======= LỆNH SPAM THẬT =======
if (command === "spam") {
    const uid = args[0];

    // ❌ Sai cú pháp
    if (!uid || isNaN(uid)) {
        const warn = await msg.reply("❌ Sai cú pháp! Dùng: `!spam <uid>`");
        setTimeout(() => warn.delete().catch(() => {}), 3000);
        return;
    }

    // Tin nhắn loading
    const loadingMsg = await msg.reply(`⏳ Đang tiến hành spam team ${uid}...`);

    const apiUrl = `https://ff-community-apiemoteessss.onrender.com/invite?uid=${uid}&region=VN`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");
        const data = await res.json();

        const resultEmbed = new EmbedBuilder()
            .setColor("#00ff80")
            .setTitle("📨 Spam Kết Quả!")
            .setDescription(
                `> UID: **${data.uid}**\n` +
                `> Region: **${data.region}**\n` +
                `> Status: **${data.status}**\n` +
                `> Thông báo: ${data.message}`
            )
            .setFooter({ text: "Dev Katari 📌" })
            .setTimestamp();

        await msg.channel.send({ embeds: [resultEmbed] });

        // Xóa loading
        setTimeout(() => loadingMsg.delete().catch(() => {}), 3000);

    } catch (err) {
        console.error(err);

        const errorEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("> ❌ Lỗi: Không thể kết nối đến API spam.")
            .setFooter({ text: "Dev Katari 📌" })
            .setTimestamp();

        const errMsg = await msg.channel.send({ embeds: [errorEmbed] });

        // Xóa lỗi + loading
        setTimeout(() => {
            errMsg.delete().catch(() => {});
            loadingMsg.delete().catch(() => {});
        }, 3000);
    }
}
// ======= HẾT LỆNH SPAM =======

   // ===================== LỆNH !GHOST (EMBED MỚI) =====================
if (command === "ghost") {
  const code = args[0];

  // ❌ Sai cú pháp
  if (!code || isNaN(code)) {
    const msgError = await msg.reply(
      "> ❌ Sai cú pháp!\n> Ví dụ: `!ghost 1455154`"
    );
    setTimeout(() => msgError.delete().catch(() => {}), 5000);
    return;
  }

  // Loading
  const loading = await msg.reply(
    `👻 **Đang ghost teamcode...**\n> TeamCode: **${code}**`
  );

  try {
    const url = `https://ghost-code-amph.onrender.com/execute_command_all?command=/bngx=${code}`;
    const res = await axios.get(url);
    const results = res.data?.results || {};

    const embed = new EmbedBuilder()
      .setColor(0x00c3ff)
      .setTitle("👻 Ghost TeamCode thành công")
      .setDescription(
        `> Người yêu cầu: <@${msg.author.id}>\n` +
        `> TeamCode: **${code}**\n\n` +
        `📋 **Danh sách tài khoản đã ghost:**`
      )
      .setFooter({ text: "Dev Katari📌" })
      .setTimestamp();

    for (const id in results) {
      let name = "Không tìm thấy";
      const match = results[id]?.match(/Name:\s*(.*)$/);
      if (match?.[1]) name = match[1].trim();

      embed.addFields({
        name: `🆔 UID: ${id}`,
        value: `👤 Tên: **${name}**`,
        inline: false
      });
    }

    await loading.edit({
      content: "✅ **Ghost hoàn tất!**",
      embeds: [embed]
    });

  } catch (err) {
    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("❌ Ghost TeamCode thất bại")
      .setDescription(
        `> TeamCode: **${code}**\n` +
        `> API không phản hồi hoặc gặp lỗi.\n\n` +
        `⚠️ Vui lòng thử lại sau.`
      )
      .setFooter({ text: "Dev Katari📌" })
      .setTimestamp();

    await loading.edit({
      content: null,
      embeds: [errorEmbed]
    });

    setTimeout(() => loading.delete().catch(() => {}), 5000);
  }
}
// ===================== HẾT LỆNH !GHOST =====================

   // ===================== LỆNH !TEAM5 & !TEAM6 =====================
if (command === "team5" || command === "team6") { // bỏ dấu "!" nếu đã parse
    const uid = args[0];

    // ❌ Sai cú pháp
    if (!uid) { // không kiểm tra isNaN nữa, chấp nhận UID dài
        const errMsg = await msg.reply("> ❌ Sai cú pháp!\n> Ví dụ: `!team5 12345678`");

        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);

        return;
    }

    // Tin nhắn loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang tạo team ${command === "team5" ? "5" : "6"}...**\n` +
        `> Chuẩn bị mời **UID: ${uid}**`
    );

    // ✅ CHỈ THAY API TEAM5 – TEAM6 GIỮ NGUYÊN
    const apiUrl =
        command === "team5"
            ? `https://team-create.onrender.com/5?uid=${uid}`
            : `https://ff-community-apiemoteessss.onrender.com/6?uid=${uid}&region=VN`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        await res.json(); // chỉ gọi API, không cần hiển thị data

        const embed = new EmbedBuilder()
            .setColor(command === "team5" ? 0x00c3ff : 0xff7b00)
            .setTitle(`🎮 Team ${command === "team5" ? "5" : "6"} đã sẵn sàng`)
            .setDescription(
                `> Người dùng yêu cầu: <@${msg.author.id}>\n` +
                `> Sẵn sàng mời **UID: ${uid}**\n\n` +
                `✨ Team đã được tạo thành công!`
            )
            .setFooter({ text: "Dev Katari📌" })
            .setTimestamp();

        // update loading → embed
        await loadingMsg.edit({
            content: "✅ **Hoàn tất! Hãy chấp nhận lời mời:**",
            embeds: [embed]
        });

    } catch (err) {
        console.log(err);

        const errMsg = await msg.reply(
            "❌ **Không thể tạo team. API gặp lỗi hoặc không phản hồi.**"
        );

        setTimeout(() => errMsg.delete().catch(() => {}), 5000);

        // Xóa lệnh user + loading nếu lỗi
        msg.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
    }
}

   // ===================== LỆNH !LAG =====================
if (command === "lag") { // loại bỏ "!" ở đây
    const teamcode = args[0];

    // ❌ Sai cú pháp
    if (!teamcode) {
        const errMsg = await msg.reply("> ❌ Sai cú pháp!\n> Ví dụ: `!lag 1234567`");

        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);

        return;
    }

    // Tin nhắn loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang tiến hành làm lag team ${teamcode}...**`
    );

    const apiUrl = `https://ff-community-apiemoteessss.onrender.com/lag?teamcode=${teamcode}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        await res.json(); // chỉ gọi API, không cần hiển thị data

        // Embed kết quả
        const embed = new EmbedBuilder()
            .setColor(0xffd700)
            .setTitle(`⚡ Làm lag hoàn tất`)
            .setDescription(
                `> Người dùng yêu cầu: <@${msg.author.id}>\n` +
                `> Team code: **${teamcode}**\n\n` +
                `✨ Đã làm lag cực mạnh team **${teamcode}** thành công!`
            )
            .setFooter({ text: "Dev Katari📌" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ **Kết quả:**",
            embeds: [embed]
        });

    } catch (err) {
        console.log(err);

        const errMsg = await msg.reply(
            "❌ **Không thể làm lag. API gặp lỗi hoặc không phản hồi.**"
        );

        setTimeout(() => errMsg.delete().catch(() => {}), 5000);

        // Xóa lệnh user + loading nếu lỗi
        msg.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
    }
}

   // ===================== LỆNH !EMOTE (1 người) =====================
if (command === "emote") {
    const teamcode = args[0];
    const uid = args[1];
    let emoteInput = args[2]; // có thể là tên hoặc ID

    // ❌ Sai cú pháp
    if (!teamcode || !uid || !emoteInput) {
        const errMsg = await msg.reply(
            "> ❌ Sai cú pháp!\n" +
            "> Ví dụ: `!emote 1234567 12345678 m60`"
        );
        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 6000);
        return;
    }

    // === Map tên hành động → emote ID ===
    const emoteMap = {
        "ak47": "909000063",
        "scar": "909000068",
        "mp401": "909000075",
        "mp402": "909040010",
        "m10141": "909000081",
        "m10142": "909039011",
        "xm8": "909000085",
        "ump": "909000098",
        "mp5": "909033002",
        "famas": "909000090",
        "m1887": "909035007",
        "thomson": "909038010",
        "an94": "909035012",
        "m4a1": "909033001",
        "g18": "909038012",
        "namdam": "909037011",
        "groza": "909041005",
        "chimgokien": "909042008",
        "paralfell": "909045001",
        "p90": "909049010",
        "m60": "909051003",
        "ngaivang": "909000014",
        "camco": "909000034",
        "camco2": "909000128",
        "tanghoa": "909000010",
        "thatim": "909000045",
        "muaxe": "909000074",
        "muaxe2": "909000088",
        "lv100": "909042007",
        "tim": "909043010",
        "tim2": "909043013",
        "tim3": "909047003",
        "bapbenh": "909045012",
        "anmung": "909046004",
        "laugiay": "909046005",
        "narutodoi": "909050003",
        "lienket": "909049008",
        "cuu": "909050013",
        "choicungnhau": "909051017",
        "giangsinh1": "909051002",
        "giangsinh2": "909051018",
        "giangsinh3": "909051019",
        "giangsinh4": "909051020",
        "naruto": "909050002"
    };

    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // Loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang gửi emote ${emoteId} đến UID ${uid}...**`
    );

    // 🔥 API MỚI (đã thay)
    const apiUrl =
        `https://katarixemotevipacccount.onrender.com/join` +
        `?tc=${teamcode}` +
        `&uid1=${uid}` +
        `&emote_id=${emoteId}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const embed = new EmbedBuilder()
            .setColor(0x00c3ff)
            .setTitle("🎭 Gửi Emote Thành Công!")
            .setDescription(
                `> Người dùng: <@${msg.author.id}>\n` +
                `> Team code: **${teamcode}**\n` +
                `> UID: **${uid}**\n` +
                `> Emote ID: **${emoteId}**\n\n` +
                `✨ ${data.message || "Emote đã gửi thành công!"}`
            )
            .setFooter({ text: "Dev Katari📌" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ **Kết quả:**",
            embeds: [embed]
        });

    } catch (err) {
        console.log(err);
        const errMsg = await msg.reply(
            "❌ **Không thể gửi emote. API gặp lỗi hoặc không phản hồi.**"
        );
        setTimeout(() => errMsg.delete().catch(() => {}), 5000);
        loadingMsg.delete().catch(() => {});
    }
}

    // ===================== LỆNH !RANDOM (AUTO EMOTE) =====================
if (command === "random") {

    // ================= STOP =================
    if (args[0] === "stop") {
        if (!randomRunning) {
            const m = await msg.reply("⚠️ **Hiện không có auto emote nào đang chạy!**");
            return setTimeout(() => m.delete().catch(() => {}), 5000);
        }

        if (msg.author.id !== randomUserId && !msg.member.permissions.has("Administrator")) {
            const m = await msg.reply(
                "🚫 **Bạn không có quyền dừng auto emote này!**"
            );
            return setTimeout(() => m.delete().catch(() => {}), 5000);
        }

        randomStop = true;
        const m = await msg.reply("🛑 **Đã gửi yêu cầu dừng auto emote!**");
        return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    // ================= CHECK ĐANG CHẠY =================
    if (randomRunning) {
        const m = await msg.reply(
            "⏳ **Auto emote đang được sử dụng!**\n⚠️ Vui lòng chờ hoàn tất."
        );
        return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const teamcode = args[0];
    const uid = args[1];

    if (!teamcode || !uid) {
        const m = await msg.reply(
            "> ❌ Sai cú pháp!\n> Ví dụ: `!random 1234567 12345678`"
        );
        return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    // ================= KHÓA =================
    randomRunning = true;
    randomUserId = msg.author.id;
    randomUserTag = msg.author.tag;
    randomStop = false;

    // ================= MAP EMOTE =================
    const emoteMap = {
        ak47: "909000063",
        scar: "909000068",
        mp401: "909000075",
        mp402: "909040010",
        m10141: "909000081",
        m10142: "909039011",
        xm8: "909000085",
        ump: "909000098",
        mp5: "909033002",
        famas: "909000090",
        m1887: "909035007",
        thomson: "909038010",
        an94: "909035012",
        m4a1: "909033001",
        g18: "909038012",
        groza: "909041005",
        p90: "909049010",
        m60: "909051003"
    };

    const emoteEntries = Object.entries(emoteMap);
    const total = emoteEntries.length;

    // 👉 START (có thể tag ở đây nếu muốn)
    randomMessage = await msg.reply(
        `🤖 **Bắt đầu auto emote...**\n` +
        `> Team code: **${teamcode}**\n` +
        `> UID: **${uid}**`
    );

    try {
        let index = 0;

        for (const [emoteName, emoteId] of emoteEntries) {

            // 🛑 CHECK DỪNG
            if (randomStop) {
                await randomMessage.edit(
                    `🛑 **Auto Emote đã bị dừng!**\n` +
                    `⏹ Dừng tại: **${emoteName.toUpperCase()}**`
                );
                break;
            }

            index++;

            // ❌ KHÔNG TAG USER Ở ĐÂY
            await randomMessage.edit(
                `🤖 **Auto Emote (${index}/${total})**\n` +
                `🎭 Emote: **${emoteName.toUpperCase()}**\n` +
                `⏱ Tiếp theo sau **5 giây**`
            );

            const apiUrl =
                `https://katarixemotevipacccount.onrender.com/join` +
                `?tc=${teamcode}&uid1=${uid}&emote_id=${emoteId}`;

            await fetch(apiUrl);

            // ⏱ DELAY 5 GIÂY
            await new Promise(r => setTimeout(r, 5000));
        }

        // ================= HOÀN TẤT =================
        if (!randomStop) {
            const embed = new EmbedBuilder()
                .setColor(0x00ff9c)
                .setTitle("🤖 Auto Emote Hoàn Tất!")
                .setDescription(
                    `> Team code: **${teamcode}**\n` +
                    `> UID: **${uid}**\n\n` +
                    `✅ **Hoàn tất toàn bộ emote**`
                )
                .setFooter({ text: "Dev Katari📌" })
                .setTimestamp();

            await randomMessage.edit({
                content: "🎉 **Hoàn tất auto emote!**",
                embeds: [embed]
            });
        }

    } catch (err) {
        console.error(err);
        const m = await msg.reply("❌ **Lỗi API – Auto emote bị hủy!**");
        setTimeout(() => {
            m.delete().catch(() => {});
            randomMessage?.delete().catch(() => {});
        }, 5000);
    }

    // ================= NHẢ KHÓA =================
    randomRunning = false;
    randomUserId = null;
    randomUserTag = null;
    randomStop = false;
    randomMessage = null;
}

   // ===================== LỆNH !EMOTES (MULTI UID) =====================
if (command === "emotes") {

    const teamcode = args[0];
    const uid1 = args[1];
    const uid2 = args[2];
    const uid3 = args[3];
    const uid4 = args[4];
    const uid5 = args[5];
    const uid6 = args[6];
    const emoteInput = args[7]; // tên hoặc ID

    // ❌ Sai cú pháp
    if (!teamcode || !uid1 || !emoteInput) {
        const m = await msg.reply(
            "> ❌ Sai cú pháp!\n" +
            "> Ví dụ:\n" +
            "> `!emotes 1234567 111 m60`\n" +
            "> `!emotes 1234567 111 222 333 444 555 naruto`"
        );
        return setTimeout(() => m.delete().catch(() => {}), 6000);
    }

    // ================= MAP HÀNH ĐỘNG (GIỮ NGUYÊN) =================
    const emoteMap = {
        ak47: "909000063",
        scar: "909000068",
        mp401: "909000075",
        mp402: "909040010",
        m10141: "909000081",
        m10142: "909039011",
        xm8: "909000085",
        ump: "909000098",
        mp5: "909033002",
        famas: "909000090",
        m1887: "909035007",
        thomson: "909038010",
        an94: "909035012",
        m4a1: "909033001",
        g18: "909038012",
        namdam: "909037011",
        groza: "909041005",
        chimgokien: "909042008",
        paralfell: "909045001",
        p90: "909049010",
        m60: "909051003",
        ngaivang: "909000014",
        camco: "909000034",
        camco2: "909000128",
        tanghoa: "909000010",
        thatim: "909000045",
        muaxe: "909000074",
        muaxe2: "909000088",
        lv100: "909042007",
        tim: "909043010",
        tim2: "909043013",
        tim3: "909047003",
        bapbenh: "909045012",
        anmung: "909046004",
        laugiay: "909046005",
        narutodoi: "909050003",
        lienket: "909049008",
        cuu: "909050013",
        choicungnhau: "909051017",
        giangsinh1: "909051002",
        giangsinh2: "909051018",
        giangsinh3: "909051019",
        giangsinh4: "909051020",
        naruto: "909050002"
    };

    // tên → ID
    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // ================= API MỚI (JOIN – MAX 6 UID) =================
    const apiUrl =
        `https://katarixemotevipacccount.onrender.com/join` +
        `?tc=${teamcode}` +
        `&uid1=${uid1}` +
        `${uid2 ? `&uid2=${uid2}` : ""}` +
        `${uid3 ? `&uid3=${uid3}` : ""}` +
        `${uid4 ? `&uid4=${uid4}` : ""}` +
        `${uid5 ? `&uid5=${uid5}` : ""}` +
        `${uid6 ? `&uid6=${uid6}` : ""}` +
        `&emote_id=${emoteId}`;

    // ================= LOADING =================
    const loadingMsg = await msg.reply(
        `⏳ **Đang gửi emote cho nhiều người...**\n` +
        `🎭 Emote: **${emoteId}**`
    );

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const uidList =
            `• ${uid1}\n` +
            `${uid2 ? `• ${uid2}\n` : ""}` +
            `${uid3 ? `• ${uid3}\n` : ""}` +
            `${uid4 ? `• ${uid4}\n` : ""}` +
            `${uid5 ? `• ${uid5}\n` : ""}` +
            `${uid6 ? `• ${uid6}\n` : ""}`;

        // ================= EMBED KẾT QUẢ =================
        const embed = new EmbedBuilder()
            .setColor(0x00c3ff)
            .setTitle("🎭 Gửi Emote Thành Công!")
            .setDescription(
                `> Người dùng: <@${msg.author.id}>\n` +
                `> Team code: **${teamcode}**\n` +
                `> Emote ID: **${emoteId}**\n\n` +
                `👥 **Danh sách UID:**\n${uidList}\n` +
                `✨ ${data.message || "Emote đã được gửi"}`
            )
            .setFooter({ text: "Dev Katari📌" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ **Kết quả:**",
            embeds: [embed]
        });

    } catch (err) {
        console.error(err);
        const m = await msg.reply("❌ **Không thể gửi emote – API lỗi**");
        setTimeout(() => {
            m.delete().catch(() => {});
            loadingMsg.delete().catch(() => {});
        }, 5000);
    }
}

    // ===================== LỆNH !RANDOMS (AUTO EMOTE MULTI UID) =====================
if (command === "randoms") {

    // ================= STOP =================
    if (args[0] === "stop") {
        if (!randomsRunning) {
            const m = await msg.reply("⚠️ **Hiện không có auto emote nào đang chạy!**");
            return setTimeout(() => m.delete().catch(() => {}), 5000);
        }

        if (msg.author.id !== randomsUserId && !msg.member.permissions.has("Administrator")) {
            const m = await msg.reply("🚫 **Bạn không có quyền dừng auto emote này!**");
            return setTimeout(() => m.delete().catch(() => {}), 5000);
        }

        randomsStop = true;
        const m = await msg.reply("🛑 **Đã gửi yêu cầu dừng auto emote!**");
        return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    // ================= CHECK ĐANG CHẠY =================
    if (randomsRunning) {
        const m = await msg.reply(
            "⏳ **Auto emote đang được sử dụng!**\n⚠️ Vui lòng chờ hoàn tất."
        );
        return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    const teamcode = args[0];
    const uid1 = args[1];
    const uid2 = args[2];
    const uid3 = args[3];
    const uid4 = args[4];
    const uid5 = args[5];
    const uid6 = args[6];

    if (!teamcode || !uid1) {
        const m = await msg.reply(
            "> ❌ Sai cú pháp!\n" +
            "> Ví dụ:\n" +
            "> `!randoms 1234567 111`\n" +
            "> `!randoms 1234567 111 222 333 444 555 666`"
        );
        return setTimeout(() => m.delete().catch(() => {}), 6000);
    }

    // ================= KHÓA =================
    randomsRunning = true;
    randomsUserId = msg.author.id;
    randomsStop = false;

    // ================= MAP EMOTE =================
    const emoteMap = {
        ak47: "909000063",
        scar: "909000068",
        mp401: "909000075",
        mp402: "909040010",
        m10141: "909000081",
        m10142: "909039011",
        xm8: "909000085",
        ump: "909000098",
        mp5: "909033002",
        famas: "909000090",
        m1887: "909035007",
        thomson: "909038010",
        an94: "909035012",
        m4a1: "909033001",
        g18: "909038012",
        groza: "909041005",
        p90: "909049010",
        m60: "909051003"
    };

    const emoteEntries = Object.entries(emoteMap);
    const total = emoteEntries.length;

    // ================= START =================
    randomsMessage = await msg.reply(
        `🤖 **Bắt đầu auto emote (MULTI UID)...**\n` +
        `> Team code: **${teamcode}**\n` +
        `> UID: ${[uid1, uid2, uid3, uid4, uid5, uid6].filter(Boolean).join(", ")}`
    );

    try {
        let index = 0;

        for (const [emoteName, emoteId] of emoteEntries) {

            // 🛑 CHECK DỪNG
            if (randomsStop) {
                await randomsMessage.edit(
                    `🛑 **Auto Emote đã bị dừng!**\n` +
                    `⏹ Dừng tại: **${emoteName.toUpperCase()}**`
                );
                break;
            }

            index++;

            await randomsMessage.edit(
                `🤖 **Auto Emote (${index}/${total})**\n` +
                `🎭 Emote: **${emoteName.toUpperCase()}**\n` +
                `⏱ Tiếp theo sau **5 giây**`
            );

            // ================= API =================
            const apiUrl =
                `https://katarixemotevipacccount.onrender.com/join` +
                `?tc=${teamcode}` +
                `&uid1=${uid1}` +
                `${uid2 ? `&uid2=${uid2}` : ""}` +
                `${uid3 ? `&uid3=${uid3}` : ""}` +
                `${uid4 ? `&uid4=${uid4}` : ""}` +
                `${uid5 ? `&uid5=${uid5}` : ""}` +
                `${uid6 ? `&uid6=${uid6}` : ""}` +
                `&emote_id=${emoteId}`;

            await fetch(apiUrl);

            // ⏱ DELAY 5 GIÂY
            await new Promise(r => setTimeout(r, 5000));
        }

        // ================= HOÀN TẤT =================
        if (!randomsStop) {
            const embed = new EmbedBuilder()
                .setColor(0x00ff9c)
                .setTitle("🤖 Auto Emote Hoàn Tất!")
                .setDescription(
                    `> Team code: **${teamcode}**\n` +
                    `> UID: ${[uid1, uid2, uid3, uid4, uid5, uid6].filter(Boolean).join(", ")}\n\n` +
                    `✅ **Hoàn tất toàn bộ emote**`
                )
                .setFooter({ text: "Dev Katari📌" })
                .setTimestamp();

            await randomsMessage.edit({
                content: "🎉 **Hoàn tất auto emote!**",
                embeds: [embed]
            });
        }

    } catch (err) {
        console.error(err);
        const m = await msg.reply("❌ **Lỗi API – Auto emote bị hủy!**");
        setTimeout(() => {
            m.delete().catch(() => {});
            randomsMessage?.delete().catch(() => {});
        }, 5000);
    }

    // ================= NHẢ KHÓA =================
    randomsRunning = false;
    randomsUserId = null;
    randomsStop = false;
    randomsMessage = null;
}

   // ======= LỆNH ADDFRIEND =======
if (command === "addfriend") {
    if (!admins.includes(msg.author.id)) {
        await msg.reply("❌ Bạn không có quyền sử dụng lệnh này!");
        return;
    }

    const targetUid = args[0];
    if (!targetUid) {
        const errMsg = await msg.reply("> ❌ Sai cú pháp!\n> Ví dụ: `!addfriend 12345678`");
        setTimeout(() => errMsg.delete().catch(() => {}), 5000);
        return;
    }

    const loadingMsg = await msg.reply("⏳ **Đang gửi lời mời kết bạn...**");

    const apiUrl = `https://danger-add-friend.vercel.app/adding_friend?uid=4179297209&password=0606DCB7D7D035FA83C9FDFB2BDAC407A04022B9F10CEBF4B58D44D26E5790C6&friend_uid=${targetUid}`;
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        const success = data.success || data.status === "ok" || (typeof data.message === "string" && data.message.toLowerCase().includes("success"));

        const embed = new EmbedBuilder()
            .setColor(success ? 0x9b59b6 : 0xe74c3c)
            .setTitle(success ? "💜 Kết Bạn Thành Công!" : "❌ Kết Bạn Thất Bại!")
            .setDescription(
                `> Admin: <@${msg.author.id}>\n` +
                `> UID mục tiêu: **${targetUid}**\n\n` +
                `✨ **Trạng thái:** ${success ? "Đã gửi lời mời!" : "Không thể gửi lời mời!"}`
            )
            .setImage(
                success
                    ? "https://cdn.discordapp.com/attachments/1433822412977344643/1435248916135153676/standard_6.gif"
                    : "https://cdn.discordapp.com/attachments/1433822412977344643/1435248916470956142/standard_7.gif"
            )
            .setFooter({ text: "dev Katari📌" })
            .setTimestamp();

        await loadingMsg.edit({ content: success ? "✅ **Kết quả:**" : "❌ **Lỗi:**", embeds: [embed] });
    } catch (err) {
        console.error(err);
        const embed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle("❌ API Gặp Lỗi!")
            .setDescription(`Không thể gửi yêu cầu kết bạn.\n> ⚠️ *Chi tiết lỗi đã được ẩn để bảo mật API.*`)
            .setImage("https://cdn.discordapp.com/attachments/1433822412977344643/1435248916470956142/standard_7.gif")
            .setFooter({ text: "dev Katari📌" })
            .setTimestamp();
        await loadingMsg.edit({ embeds: [embed] });
    }
}

   // ======= LỆNH REMOVEFRIEND =======
if (command === "removefriend") {
    if (!admins.includes(msg.author.id)) {
        await msg.reply("❌ Bạn không có quyền sử dụng lệnh này!");
        return;
    }

    const targetUid = args[0];
    if (!targetUid) {
        const errMsg = await msg.reply("> ❌ Sai cú pháp!\n> Ví dụ: `!removefriend 12345678`");
        setTimeout(() => errMsg.delete().catch(() => {}), 5000);
        return;
    }

    const loadingMsg = await msg.reply("⏳ **Đang xóa bạn bè...**");

    const apiUrl = `https://danger-add-friend.vercel.app/remove_friend?uid=4179297209&password=0606DCB7D7D035FA83C9FDFB2BDAC407A04022B9F10CEBF4B58D44D26E5790C6&friend_uid=${targetUid}`;
    try {
        const res = await fetch(apiUrl);
        const data = await res.json();
        const success = data.success || data.status === "ok" || (typeof data.message === "string" && data.message.toLowerCase().includes("success"));

        const embed = new EmbedBuilder()
            .setColor(success ? 0x9b59b6 : 0xe74c3c)
            .setTitle(success ? "💜 Xóa Bạn Thành Công!" : "❌ Xóa Bạn Thất Bại!")
            .setDescription(
                `> Admin: <@${msg.author.id}>\n` +
                `> UID mục tiêu: **${targetUid}**\n\n` +
                `✨ **Trạng thái:** ${success ? "Đã xóa khỏi danh sách bạn bè!" : "Không thể xóa!"}`
            )
            .setImage(
                success
                    ? "https://cdn.discordapp.com/attachments/1433822412977344643/1435248916135153676/standard_6.gif"
                    : "https://cdn.discordapp.com/attachments/1433822412977344643/1435248916470956142/standard_7.gif"
            )
            .setFooter({ text: "dev Katari📌" })
            .setTimestamp();

        await loadingMsg.edit({ content: success ? "✅ **Kết quả:**" : "❌ **Lỗi:**", embeds: [embed] });
    } catch (err) {
        console.error(err);
        const embed = new EmbedBuilder()
            .setColor(0xe74c3c)
            .setTitle("❌ API Gặp Lỗi!")
            .setDescription(`Không thể xóa bạn bè.\n> ⚠️ *Chi tiết lỗi đã được ẩn để bảo mật API.*`)
            .setImage("https://cdn.discordapp.com/attachments/1433822412977344643/1435248916470956142/standard_7.gif")
            .setFooter({ text: "dev Katari📌" })
            .setTimestamp();
        await loadingMsg.edit({ embeds: [embed] });
    }
}

   // ======= LỆNH SEARCH =======
if (command === "search") {
  const region = args[0];
  const nickname = args.slice(1).join(" ");

  // ❌ Sai cú pháp
  if (!region || !nickname) {
    const err = await msg.reply(
      "> ❌ Sai cú pháp!\n> Ví dụ: !search vn Katari"
    );

    setTimeout(() => {
      err.delete().catch(() => {});
      msg.delete().catch(() => {});
    }, 5000);

    return;
  }

  const loading = await msg.reply(
    `🔍 Đang tìm người chơi **${nickname}** tại khu vực **${region.toUpperCase()}**...`
  );

  try {
    const apiUrl = `http://danger-search-nickname.vercel.app/name/${region}?nickname=${encodeURIComponent(nickname)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("API lỗi");

    const data = await res.json();
    const results = data?.results || [];

    // ❌ Không có kết quả
    if (results.length === 0) {
      await loading.edit("❌ Không tìm thấy người chơi nào.");

      setTimeout(() => {
        loading.delete().catch(() => {});
        msg.delete().catch(() => {});
      }, 5000);

      return;
    }

    await loading.delete().catch(() => {});

    let index = 0;

    for (const acc of results) {
      index++;

      const uid = acc.accountId;
      const name = acc.nickname || "Unknown";
      const lvl = acc.level ?? "N/A";
      const liked = acc.detailed_info?.liked ?? 0;
      const lastLogin = acc.lastLogin || "N/A";
      const status = acc.status || "Unknown";
      const rg = acc.region || region.toUpperCase();

      // Ngày tạo giữ nguyên JSON
      const createdAt = acc.detailed_info?.createAt || "N/A";

      const bannerImg = `https://card.sukhdaku.qzz.io/api/profile?uid=${uid}`;

      const embed = new EmbedBuilder()
        .setColor(0x00c3ff)
        .setTitle(`🔎 Kết quả Tìm Kiếm ${index}/${results.length}`)
        .setDescription(
          `> **Tên người chơi:** ${name}\n` +
          `> **Khu vực:** :flag_${rg.toLowerCase()}: ${rg}\n` +
          `> **UID người chơi:** ${uid}\n` +
          `> **Cấp độ:** ${lvl}\n` +
          `> **Lượt thích:** ${liked}\n` +
          `> **Trạng thái:** ${status}\n` +
          `> **Ngày tạo:** ${createdAt}\n` +
          `> **Lần đăng nhập cuối:** ${lastLogin}`
        )
        .setImage(bannerImg)
        .setFooter({ text: "Dev: Katari📌" })
        .setTimestamp();

      await msg.channel.send({ embeds: [embed] });
    }

  } catch (err) {
    console.error(err);

    const errMsg = await msg.channel.send(
      "⚠️ Không thể tìm kiếm người chơi. API lỗi hoặc không phản hồi."
    );

    setTimeout(() => {
      errMsg.delete().catch(() => {});
      loading.delete().catch(() => {});
      msg.delete().catch(() => {});
    }, 5000);
  }
}
// ======= HẾT LỆNH SEARCH =======

  // ======= QUẢN LÝ AUTOLIKE HÀNG NGÀY =======

  if (["startautolike", "stopautolike", "restartautolike"].includes(command)) {

    if (!checkAdmin(msg)) return;

    if (command === "startautolike") {

      const started = startAutoLike();

      return msg.reply(started ? "✅ Đã bật autolike hàng ngày!" : "⚠️ Autolike đang chạy rồi!");

    }

    if (command === "stopautolike") {

      const stopped = stopAutoLike();

      return msg.reply(stopped ? "🛑 Đã tắt autolike!" : "⚠️ Autolike chưa chạy!");

    }

    if (command === "restartautolike") {

      stopAutoLike();

      startAutoLike();

      return msg.reply("🔄 Autolike đã được khởi động lại!");

    }

  }

});

// ==================== HÀM AUTOLIKE ====================

async function buffLikeUID(uid) {

  try {

    const res = await fetch(`https://ff.mlbbai.com/like/?key=emon&uid=${uid}`);

    const data = await res.json();

    if (data.status === 1) {

      return {

        uid,

        success: true,

        likesBefore: data.LikesbeforeCommand,

        likesAfter: data.LikesafterCommand,

        apiLikes: data.LikesGivenByAPI,

      };

    } else if (data.status === 2) {

      return { uid, success: false, reason: "Đã được buff thủ công" };

    } else {

      return { uid, success: false, reason: data.error || "Lỗi API" };

    }

  } catch (err) {

    return { uid, success: false, reason: "Lỗi kết nối API" };

  }

}

// ==================== HÀM INFO ====================
async function getFullInfoEmbed(uid, user) {
  let baseData = {};

  try {
    const res = await fetch(`https://bimoallapis.vercel.app/all/${uid}`);
    if (res.ok) baseData = await res.json();
  } catch (err) {
    console.warn("Không lấy được baseData:", err);
  }

  const result = baseData?.result || {};

  const basic   = result?.basic_info || {};
  const captain = result?.captain_basic_info || {};
  const clan    = result?.clan_basic_info || {};
  const pet     = result?.pet_info || {};
  const profile = result?.profile_info || {};
  const credit  = result?.credit_score_info || {};
  const social  = result?.social_info || {};

  const color = getRankColor(basic?.rank);

  // ✅ CHỈ THAY API BANNER
  const bannerImg = `https://card.sukhdaku.qzz.io/api/profile?uid=${uid}`;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔎 Thông tin người chơi: **${basic?.nickname || uid}**`)
    .setAuthor({ name: user.username })
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
    .setImage(bannerImg)
    .setFooter({ text: "Dev: Katari 📌" });

  const fields = [];

  // ===== THÔNG TIN CƠ BẢN =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  THÔNG TIN CƠ BẢN**\n" +
      `**├─ Tên**: ${basic?.nickname ?? "not found"}\n` +
      `**├─ UID**: \`${basic?.account_id ?? "not found"}\`\n` +
      `**├─ Cấp độ**: ${basic?.level ?? "not found"} (Exp: ${basic?.exp ?? "not found"})\n` +
      `**├─ Khu vực**: ${basic?.region ?? "not found"}\n` +
      `**├─ Lượt thích**: ${basic?.liked ?? "not found"}\n` +
      `**├─ Điểm uy tín**: ${credit?.credit_score ?? "not found"}\n` +
      `**└─ Chữ ký**: ${social?.signature || "not found"}`
  });

  // ===== HOẠT ĐỘNG TÀI KHOẢN =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  HOẠT ĐỘNG TÀI KHOẢN**\n" +
      `**├─ Phiên bản gần nhất**: ${basic?.release_version ?? "not found"}\n` +
      `**├─ Huy hiệu BP hiện tại**: ${basic?.badge_cnt ?? "not found"}\n` +
      `**├─ Rank BR**: ${basic?.ranking_points ?? "not found"}\n` +
      `**├─ Rank CS**: ${basic?.cs_ranking_points ?? "not found"}\n` +
      `**├─ Ngày tạo**: ${formatTimestamp(basic?.create_at)}\n` +
      `**└─ Đăng nhập gần nhất**: ${formatTimestamp(basic?.last_login_at)}`
  });

  // ===== TỔNG QUAN =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  TỔNG QUAN**\n" +
      `**├─ Avatar ID**: ${profile?.avatar_id ?? "not found"}\n` +
      `**├─ Banner ID**: ${basic?.banner_id ?? "not found"}\n` +
      `**├─ Pin ID**: ${basic?.pin_id ?? "not found"}\n` +
      `**└─ Kỹ năng được trang bị**: [${
        profile?.equiped_skills?.join(", ") || "not found"
      }]`
  });

  // ===== THÚ CƯNG =====
  if (pet?.id) {
    fields.push({
      name: "\u200b",
      value:
        "**┌  THÚ CƯNG**\n" +
        `**├─ Đang dùng?**: ${pet?.is_selected ? "Có" : "Không"}\n` +
        `**├─ Tên thú cưng**: ${pet?.name || "not found"}\n` +
        `**├─ Kinh nghiệm**: ${pet?.exp ?? "not found"}\n` +
        `**└─ Cấp độ**: ${pet?.level ?? "not found"}`
    });
  }

  // ===== QUÂN ĐOÀN =====
  if (clan?.clan_id) {
    fields.push({
      name: "\u200b",
      value:
        "**┌  QUÂN ĐOÀN**\n" +
        `**├─ Tên quân đoàn**: ${clan?.clan_name ?? "not found"}\n` +
        `**├─ ID quân đoàn**: \`${clan?.clan_id ?? "not found"}\`\n` +
        `**├─ Cấp**: ${clan?.clan_level ?? "not found"}\n` +
        `**├─ Thành viên**: ${clan?.member_num ?? "0"}/${clan?.capacity ?? "0"}\n` +
        "**└─ Thông tin chủ quân đoàn**:\n" +
        `    **├─ Tên**: ${captain?.nickname ?? "not found"}\n` +
        `    **├─ UID**: \`${captain?.account_id ?? "not found"}\`\n` +
        `    **├─ Cấp độ**: ${captain?.level ?? "not found"} (Exp: ${captain?.exp ?? "not found"})\n` +
        `    **├─ Lần đăng nhập gần nhất**: ${formatTimestamp(captain?.last_login_at)}\n` +
        `    **├─ Danh hiệu**: ${captain?.title ?? "not found"}\n` +
        `    **├─ Huy hiệu BP**: ${captain?.badge_cnt ?? "not found"}\n` +
        `    **├─ Rank BR**: ${captain?.ranking_points ?? "not found"}\n` +
        `    **└─ Rank CS**: ${captain?.cs_ranking_points ?? "not found"}`
    });
  }

  embed.addFields(fields);
  return embed;
}

// ================== FORMAT TIME ==================

function formatTimestamp(ts) {

  if (!ts) return "N/A";

  return new Date(Number(ts) * 1000).toLocaleString("vi-VN");

}

 

// ================== MÀU THEO RANK ==================

function getRankColor(rank) {

  if (!rank) return "#808080";

  const name = rank.toString().toLowerCase();

  if (name.includes("heroic") || name.includes("huyền thoại")) return "#FF0000";

  if (name.includes("diamond") || name.includes("kim cương")) return "#00BFFF";

  if (name.includes("platinum") || name.includes("bạch kim")) return "#C0C0C0";

  if (name.includes("gold") || name.includes("vàng")) return "#FFD700";

  if (name.includes("silver") || name.includes("bạc")) return "#C0C0C0";

  if (name.includes("bronze") || name.includes("đồng")) return "#CD7F32";

  return "#00FFFF";

}

 

// ==================== LOGIN BOT ====================

client.login(TOKEN);

 

// ==================== KHỞI ĐỘNG AUTOLIKE NGAY KHI BOT CHẠY ====================

startAutoLike();

// ====== EXPRESS KEEP-ALIVE ======
const app = express();
const PORT = process.env.PORT || 3000;

// Route ping
app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Ping server online on port ${PORT}`);
});