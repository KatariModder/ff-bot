let randomRunning = false;
let randomUserId = null;
let randomUserTag = null;
let randomStop = false;
let randomMessage = null;
let randomsRunning = false;
let randomsUserId = null;
let randomsStop = false;
let randomsMessage = null;

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

**!visits <region> <UID>**
> Tăng lượt xem cho tài khoản thông qua API visit.
> 🧩 Ví dụ: \`!visits vn 12345678\`

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
📦 Phiên bản bot: **v4**

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

    const apiUrl = `https://ff.garena.cloud/like?uid=${uid}&server=vn&key=FREE-FIRE-LIKE-API`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    if (data.success === 1 && data.status === true) {

      const r = data.response;

      const nickname = r.PlayerNickname || "N/A";
      const level = r.PlayerLevl || "N/A";
      const region = r.Region || "N/A";
      const before = r.LikesbeforeCommand || 0;
      const added = r.LikesGivenByAPI || 0;
      const after = r.LikesafterCommand || 0;

      const embed = new EmbedBuilder()
        .setTitle("✅ BUFF LIKE THÀNH CÔNG")
        .setColor("Green")
        .setDescription(
`> **Tên:** ${nickname}
> **UID:** \`${uid}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Like trước:** ${before}
> **Like thêm:** +${added}
> **Like sau:** ${after}`
        )
        .setThumbnail(
          msg.author.displayAvatarURL({ dynamic: true, size: 256 })
        )
        .setFooter({ text: "DEVELOPED BY KATARI" })
        .setTimestamp();

      await processing.edit({
        content: null,
        embeds: [embed]
      });

    } else {

      const errMsg = await processing.edit(
        "⚠️ UID này đã **MAX LIKE** hoặc API không thể gửi thêm."
      );

      setTimeout(() => {
        errMsg.delete().catch(() => {});
      }, 10000);

    }

  } catch (err) {

    console.error(err);

    const errMsg = await processing.edit(
      "❌ Không thể kết nối API Like."
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
  if (!uid || isNaN(uid)) return msg.reply("❌ UID không hợp lệ!");

  const processing = await msg.reply({
    content: `🔍 Đang kiểm tra UID **${uid}**...`,
    files: [loadingGIF]
  });

  try {

    // ===== API CHECK BAN MỚI =====
    const res = await fetch(`http://raw.thug4ff.xyz/check?uid=${uid}&key=great`);
    const data = await res.json();

    if (data.status !== 200 || !data.data) {
      throw new Error("Không tìm thấy UID");
    }

    const player = data.data;

    const nickname = player.nickname || "N/A";
    const region = player.region || "N/A";
    const level = player.level ?? "N/A";
    const lastLogin = player.last_login || "N/A";
    const exp = player.exp ?? "N/A";

    const banInfo = player.ban_info || {};
    const banStatus = player.is_banned;

    let title;
    let color;
    let image;
    let description;

    // ===== TRẠNG THÁI BAN =====

    // ❌ BAN VĨNH VIỄN
    if (banStatus === 1) {

      title = "⛔ Người chơi bị CẤM VĨNH VIỄN";
      color = "Red";
      image = "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253290639370/standard-1.gif";

      description =
`> **Lí do:** Tài khoản người chơi này đã bị ban vĩnh viễn do sử dụng phần mềm gian lận (pmt3).
> **Tên:** ${nickname}
> **UID:** \`${uid}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Thời gian bắt đầu ban:** ${formatTimestamp(banInfo.start_ban)}`;
    }

    // ⚠️ BAN TẠM THỜI
    else if (banStatus === 2) {

  title = "⚠️ Người chơi bị BAN TẠM THỜI";
  color = "Orange";

  image = "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253290639370/standard-1.gif";

  const banStart = banInfo.start_ban;
  const banEnd = banStart + banInfo.remaining_seconds;

  description = `
> **Trạng thái:** Tài khoản đang bị ban tạm thời, không nên log vào khi bị ban id (tạm thời) tránh ban cứ tiếp diễn.
> **Tên:** ${nickname}
> **UID:** \`${uid}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Bắt đầu ban:** <t:${banStart}:f>
> **Thời gian ban tạm thời kết thúc sau:** <t:${banEnd}:f>
`;

}

    // ✅ KHÔNG BAN
    else {

      title = "✅ Người chơi an toàn";
      color = "Green";

      image = "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253886361610/standard-2.gif";

      description =
`> **Trạng thái:** Không phát hiện người chơi dùng phần mềm gian lận (pmt3).
> **Tên:** ${nickname}
> **UID:** \`${uid}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Lần đăng nhập cuối:** ${formatTimestamp(lastLogin)}`;

    }

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setColor(color)
      .setDescription(description)

      // avatar discord góc phải
      .setThumbnail(
        msg.author.displayAvatarURL({ dynamic: true, size: 256 })
      )

      // gif minh họa
      .setImage(image)

      .setFooter({ text: "Dev: Katari 📌" })
      .setTimestamp();

    await processing.edit({
      content: null,
      embeds: [embed],
      files: []
    });

  } catch (err) {

    console.error(err);

    try {
      await processing.edit({
        content: "🚫 Không thể kiểm tra người chơi!\n> API không phản hồi.",
        files: []
      });
    } catch {
      await msg.channel.send("🚫 Không thể kiểm tra người chơi!\n> API không phản hồi.");
    }

  }
}
// ======= HẾT LỆNH CHECK =======

  // ======= LỆNH VISITS =======
if (command === "visits") {

  const uid = args[0];

  if (!uid || isNaN(uid)) {
    return msg.reply(
      "❌ Sai cú pháp!\n> Ví dụ: `!visits 12345678`"
    );
  }

  const apiUrl = `https://freefireservicevisit.spcfy.eu/visit?uid=${uid}`;
  const startTime = Date.now();

  const loading = await msg.reply(
    `🌍 Đang gửi visit cho UID **${uid}**...`
  );

  try {

    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("API không phản hồi");

    const json = await res.json();

    const user = json.data["User Info"];
    const stats = json.data["Request Stats"];

    const nickname = user["Account Name"] || "N/A";
    const region = user["Account Region"] || "N/A";
    const level = user["Account Level"] ?? "N/A";
    const likes = user["Account Likes"] ?? 0;
    const playerUID = user["Account UID"] || uid;

    const success = stats["Visit Sent"] ?? 0;

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    const embed = new EmbedBuilder()
      .setColor(Green)
      .setTitle("👁️ KẾT QUẢ VISITS")
      .setDescription(
`> **Tên:** ${nickname}
> **UID:** \`${playerUID}\`
> **Khu vực:** ${region}
> **Cấp độ:** ${level}
> **Lượt thích:** ${likes}
> **Visit đã gửi:** ${success}`
      )
      .setThumbnail(
        msg.author.displayAvatarURL({ dynamic: true, size: 256 })
      )
      .setFooter({ text: `Dev: Katari x Obiyeuem • ${elapsed}s` })
      .setTimestamp();

    await loading.edit({
      content: null,
      embeds: [embed]
    });

  } catch (err) {

    console.error(err);

    const errMsg = await loading.edit(
      "❌ Không thể gửi visit.\n> API lỗi hoặc không phản hồi."
    );

    setTimeout(() => {
      errMsg.delete().catch(() => {});
      msg.delete().catch(() => {});
    }, 5000);

  }

}
// ======= HẾT LỆNH VISITS =======

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

   // ======= LỆNH SPAM =======
if (command === "spam") {

    const type = args[0]; // sinv / rinv
    const uid = args[1];

    // ❌ Sai cú pháp
    if (!type || !uid || isNaN(uid)) {
        const warn = await msg.reply(
            "❌ Sai cú pháp!\nVí dụ:\n`!spam sinv 12345678`\n`!spam rinv 12345678`"
        );

        setTimeout(() => warn.delete().catch(() => {}), 4000);
        return;
    }

    // ❌ type không hợp lệ
    if (!["sinv", "rinv"].includes(type)) {
        return msg.reply("❌ Type chỉ có `sinv` (team) hoặc `rinv` (room)");
    }

    const loadingMsg = await msg.reply(
        `⏳ Đang spam ${type === "sinv" ? "tổ đội" : "phòng"} cho UID **${uid}**...`
    );

    const apiUrl = `https://taycommunity.spcfy.eu/spam?uid=${uid}&type=${type}&sl=50`;

    try {

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const embed = new EmbedBuilder()
            .setColor("#Green")
            .setTitle("📨 Spam Thành Công")
            .setDescription(
`> **UID:** \`${uid}\`
> **Loại spam:** ${type === "sinv" ? "Spam tổ đội" : "Spam phòng"}
> **Số lượng:** 50
> **Bot:** ${data.BotName || "ＷＸＺ.ＯＢＩ┊ＭZPᰔ"}
> **Trạng thái:** ${data.Message || "Hoàn tất"}`
            )
            .setThumbnail(
                msg.author.displayAvatarURL({ dynamic: true, size: 256 })
            )
            .setFooter({ text: "Dev Katari x Obiyeuem" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ Spam hoàn tất!",
            embeds: [embed]
        });

    } catch (err) {

        console.error(err);

        const errorEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setDescription("> ❌ Không thể kết nối API spam.")
            .setFooter({ text: "Dev Katari x Obiyeuem" })
            .setTimestamp();

        await loadingMsg.edit({
            content: null,
            embeds: [errorEmbed]
        });
    }
}
// ======= HẾT LỆNH SPAM =======

   // ===================== LỆNH !GHOST =====================
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

  // ⏳ Loading
  const loading = await msg.reply(
    `👻 **Đang ghost teamcode...**\n> TeamCode: **${code}**`
  );

  try {

    const url = `https://taycommunity.spcfy.eu/ghost?teamcode=${code}`;
    const res = await fetch(url);

    if (!res.ok) throw new Error("API lỗi");

    const data = await res.json();

    const botName = data.BotName || "N/A";
    const message = data.Message || "Thành công";
    const teamcode = data.Teamcode || code;

    const embed = new EmbedBuilder()
      .setColor(Green)
      .setTitle("👻 Ghost TeamCode thành công")
      .setDescription(
`> **Người yêu cầu:** <@${msg.author.id}>
> **TeamCode:** \`${teamcode}\`
> **Bot thực hiện:** ${botName}
> 📩 **Trạng thái:** ${message}`
      )
      .setThumbnail(
        msg.author.displayAvatarURL({ dynamic: true, size: 256 })
      )
      .setFooter({ text: "Dev Katari x Obiyeuem" })
      .setTimestamp();

    await loading.edit({
      content: "✅ **Ghost hoàn tất!**",
      embeds: [embed]
    });

  } catch (err) {

    console.error(err);

    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle("❌ Ghost TeamCode thất bại")
      .setDescription(
        `> **TeamCode:** ${code}\n` +
        `> API không phản hồi hoặc gặp lỗi.\n\n` +
        `⚠️ Vui lòng thử lại sau.`
      )
      .setFooter({ text: "Dev Katari x Obiyeuem" })
      .setTimestamp();

    await loading.edit({
      content: null,
      embeds: [errorEmbed]
    });

    setTimeout(() => loading.delete().catch(() => {}), 5000);
  }

}
// ===================== HẾT LỆNH !GHOST =====================

   // ===================== LỆNH !TEAM3 / !TEAM4 / !TEAM5 / !TEAM6 =====================
if (command.startsWith("team")) {

    const teamNumber = command.replace("team", "");
    const uid = args[0];

    // ❌ team không hợp lệ
    if (!["3", "4", "5", "6"].includes(teamNumber)) return;

    // ❌ Sai cú pháp
    if (!uid || isNaN(uid)) {
        const errMsg = await msg.reply(
            `> ❌ Sai cú pháp!\n> Ví dụ: \`!team${teamNumber} 12345678\``
        );

        setTimeout(() => {
            errMsg.delete().catch(() => {});
            msg.delete().catch(() => {});
        }, 5000);

        return;
    }

    // ⏳ Loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang tạo team ${teamNumber}...**\n` +
        `> Chuẩn bị mời **UID: ${uid}**`
    );

    // ✅ API mới
    const apiUrl = `https://taycommunity.spcfy.eu/creatsquad?uid=${uid}&team=${teamNumber}`;

    try {

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const botName = data.BotName || "N/A";
        const message = data.Message || "Đã gửi lời mời";
        const target = data.Target || uid;
        const team = data.Team || teamNumber;

        const embed = new EmbedBuilder()
            .setColor(Green)
            .setTitle(`🎮 Team ${team} đã sẵn sàng`)
            .setDescription(
`> **Người yêu cầu:** <@${msg.author.id}>
> **UID mục tiêu:** \`${target}\`
> **Team:** ${team}
> **Bot mời:** ${botName}
> 📩 ${message}`
            )
            .setThumbnail(
                msg.author.displayAvatarURL({ dynamic: true, size: 256 })
            )
            .setFooter({ text: "Dev Katari x Obiyeuem" })
            .setTimestamp();

        await loadingMsg.edit({
            content: "✅ **Hoàn tất! Hãy chấp nhận lời mời trong game.**",
            embeds: [embed]
        });

    } catch (err) {

        console.error(err);

        const errMsg = await msg.reply(
            "❌ **Không thể tạo team. API gặp lỗi hoặc không phản hồi.**"
        );

        setTimeout(() => errMsg.delete().catch(() => {}), 5000);

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

    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // Loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang gửi emote ${emoteId} đến UID ${uid}...**`
    );

    // 🔥 API EMOTE MỚI
    const apiUrl =
        `https://emote-api-xhi9.onrender.com/join` +
        `?tc=${teamcode}` +
        `&uid1=${uid}` +
        `&emote_id=${emoteId}`;

    try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const embed = new EmbedBuilder()
            .setColor(Green)
            .setTitle("🎭 Gửi Emote Thành Công!")
            .setDescription(
                `> Người dùng: <@${msg.author.id}>\n` +
                `> Team code: **${teamcode}**\n` +
                `> UID: **${uid}**\n` +
                `> Emote ID: **${emoteId}**\n\n` +
                `✨ ${data.message || "Emote triggered"}`
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

    // ===================== LỆNH !RANDOM (AUTO EMOTE 1 UID) =====================
if (command === "random") {

    // ================= STOP =================
    if (args[0] === "stop") {
        if (!randomRunning) {
            const m = await msg.reply("⚠️ **Hiện không có auto emote nào đang chạy!**");
            return setTimeout(() => m.delete().catch(() => {}), 5000);
        }

        if (
            msg.author.id !== randomUserId &&
            !msg.member.permissions.has("Administrator")
        ) {
            const m = await msg.reply("🚫 **Bạn không có quyền dừng auto này!**");
            return setTimeout(() => m.delete().catch(() => {}), 5000);
        }

        randomStop = true;
        const m = await msg.reply("🛑 **Đã gửi yêu cầu dừng auto emote!**");
        return setTimeout(() => m.delete().catch(() => {}), 5000);
    }

    // ================= CHECK ĐANG CHẠY =================
    if (randomRunning) {
        const m = await msg.reply(
            `⏳ **Đang có auto khác chạy!**\n👤 Người dùng: <@${randomUserId}>`
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

    // ================= KHÓA CHUNG =================
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

    randomMessage = await msg.reply(
        `🤖 **Bắt đầu auto emote (1 UID)...**\n` +
        `> Team code: **${teamcode}**\n` +
        `> UID: **${uid}**`
    );

    try {
        let index = 0;

        for (const [emoteName, emoteId] of emoteEntries) {

            if (randomStop) {
                await randomMessage.edit(
                    `🛑 **Auto Emote đã bị dừng!**\n` +
                    `⏹ Dừng tại: **${emoteName.toUpperCase()}**`
                );
                break;
            }

            index++;

            await randomMessage.edit(
                `🤖 **Auto Emote (${index}/${total})**\n` +
                `🎭 Emote: **${emoteName.toUpperCase()}**\n` +
                `⏱ Tiếp theo sau **5 giây**`
            );

            const apiUrl =
                `https://emote-api-xhi9.onrender.com/join` +
                `?tc=${teamcode}&uid1=${uid}&emote_id=${emoteId}`;

            await fetch(apiUrl);
            await new Promise(r => setTimeout(r, 5000));
        }

        if (!randomStop) {
            await randomMessage.edit("🎉 **Hoàn tất auto emote!**");
        }

    } catch (err) {
        console.error(err);
        await msg.reply("❌ **Lỗi API – Auto emote bị hủy!**");
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
            "> `!emotes 1234567 111 222 333 444 naruto`"
        );
        return setTimeout(() => m.delete().catch(() => {}), 6000);
    }

    // ================= MAP EMOTE (GIỮ NGUYÊN) =================
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

    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // ================= API EMOTE 1 NGƯỜI (JOIN) =================
    const apiUrl =
        `https://emote-api-xhi9.onrender.com/join` +
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

        const embed = new EmbedBuilder()
            .setColor(Green)
            .setTitle("🎭 Gửi Emote Thành Công!")
            .setDescription(
                `> Người dùng: <@${msg.author.id}>\n` +
                `> Team code: **${teamcode}**\n` +
                `> Emote ID: **${emoteId}**\n\n` +
                `👥 **Danh sách UID:**\n${uidList}\n` +
                `✨ ${data.message || "Emote triggered"}`
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
    const uidList = args.slice(1).filter(Boolean);

    if (!teamcode || uidList.length === 0) {
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
        `> UID: ${uidList.join(", ")}`
    );

    try {
        let index = 0;

        for (const [emoteName, emoteId] of emoteEntries) {

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

            // ✅ API MỚI
            const apiUrl =
                `https://emote-api-xhi9.onrender.com/join` +
                `?tc=${teamcode}` +
                uidList.map((uid, i) => `&uid${i + 1}=${uid}`).join("") +
                `&emote_id=${emoteId}`;

            await fetch(apiUrl);
            await new Promise(r => setTimeout(r, 5000));
        }

        if (!randomsStop) {
            const embed = new EmbedBuilder()
                .setColor(Green)
                .setTitle("🤖 Auto Emote Hoàn Tất!")
                .setDescription(
                    `> Team code: **${teamcode}**\n` +
                    `> UID: ${uidList.join(", ")}\n\n` +
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
        .setColor(Green)
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

   // ===================== LỆNH !TODOI =====================
if (command === "todoi") {

    const teamcode = args[0];
    const message = args.slice(1).join(" ");

    // ❌ Sai cú pháp
    if (!teamcode || !message) {
        const warn = await msg.reply(
            "❌ Sai cú pháp!\nVí dụ:\n`!todoi 1234567 hello team`"
        );

        setTimeout(() => warn.delete().catch(() => {}), 4000);
        return;
    }

    // Loading
    const loading = await msg.reply(
        `💬 Đang gửi tin nhắn vào tổ đội...\n> TeamCode: **${teamcode}**`
    );

    const apiUrl = `https://taycommunity.spcfy.eu/msg?teamcode=${teamcode}&message=${encodeURIComponent(message)}`;

    try {

        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("API lỗi");

        const data = await res.json();

        const embed = new EmbedBuilder()
            .setColor("Green")
            .setTitle("📢 Gửi Tin Nhắn Tổ Đội")
            .setDescription(
`> **Người yêu cầu:** <@${msg.author.id}>
> **TeamCode:** \`${teamcode}\`
> **Tin nhắn:** ${message}
> **Bot:** ${data.BotName || "ＷＸＺ.ＯＢＩ┊ＭZPᰔ"}
> **Trạng thái:** ${data.Message || "Đã gửi"}`
            )
            .setThumbnail(
                msg.author.displayAvatarURL({ dynamic: true, size: 256 })
            )
            .setFooter({ text: "Dev Katari x Obiyeuem" })
            .setTimestamp();

        await loading.edit({
            content: "✅ Gửi tin nhắn thành công!",
            embeds: [embed]
        });

    } catch (err) {

        console.error(err);

        const errorEmbed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("❌ Gửi Tin Nhắn Thất Bại")
            .setDescription(
                `> TeamCode: **${teamcode}**\n> API không phản hồi hoặc gặp lỗi.`
            )
            .setFooter({ text: "Dev Katari x Obiyeuem" })
            .setTimestamp();

        await loading.edit({
            content: null,
            embeds: [errorEmbed]
        });
    }
}
// ===================== HẾT LỆNH !TODOI =====================

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

// ==================== HÀM INFO (API MỚI) ====================
async function getFullInfoEmbed(uid, user) {
  let data = {};

  try {
    const res = await fetch(`http://raw.sukhdaku.qzz.io/player/info?uid=${uid}`);
    if (!res.ok) throw new Error("API info không phản hồi");
    data = await res.json();
  } catch (err) {
    console.warn("Không lấy được data API:", err);
  }

  // ===== Mapping JSON mới =====
  const acc     = data?.playerData || {};
  const clan    = data?.guildInfo || {};
  const captain = data?.guildOwnerInfo || {};
  const pet     = data?.petInfo || {};
  const profile = data?.profileInfo || {};
  const credit  = data?.creditScoreInfo || {};
  const social  = data?.socialInfo || {};

  // ===== CẤP PRIME =====
  const prime = data?.playerData?.primeLevel?.primeLevel?.split(" ")[0] ?? 0;

  const color = getRankColor(acc?.rank);

  const bannerImg = `https://em-profile-card.vercel.app/profile?uid=${uid}`;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`🔎 Thông tin người chơi: **${acc?.nickname || uid}**`)
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
      `**├─ Tên**: ${acc?.nickname ?? "not found"}\n` +
      `**├─ UID**: \`${acc?.accountId ?? "not found"}\`\n` +
      `**├─ Cấp độ**: ${acc?.level ?? "not found"} (Exp: ${acc?.exp ?? "not found"})\n` +
      `**├─ Khu vực**: ${acc?.region ?? "not found"}\n` +
      `**├─ Lượt thích**: ${acc?.liked ?? "not found"}\n` +
      `**├─ Cấp prime**: ${prime}\n` +
      `**├─ Điểm uy tín**: ${credit?.creditScore ?? "not found"}\n` +
      `**└─ Chữ ký**: ${social?.signature || "not found"}`
  });

  // ===== HOẠT ĐỘNG TÀI KHOẢN =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  HOẠT ĐỘNG TÀI KHOẢN**\n" +
      `**├─ Phiên bản gần nhất**: ${acc?.releaseVersion ?? "not found"}\n` +
      `**├─ Huy hiệu BP hiện tại**: ${acc?.badgeCnt ?? "not found"}\n` +
      `**├─ Rank BR**: ${acc?.rankingPoints ?? "not found"}\n` +
      `**├─ Rank CS**: ${acc?.csRankingPoints ?? "not found"}\n` +
      `**├─ Ngày tạo**: ${formatTimestamp(acc?.createAt)}\n` +
      `**└─ Đăng nhập gần nhất**: ${formatTimestamp(acc?.lastLoginAt)}`
  });

  // ===== TỔNG QUAN =====
  fields.push({
    name: "\u200b",
    value:
      "**┌  TỔNG QUAN**\n" +
      `**├─ Avatar ID**: ${profile?.avatarId ?? "not found"}\n` +
      `**├─ Banner ID**: ${acc?.bannerId ?? "not found"}\n` +
      `**├─ Pin ID**: ${acc?.pinId ?? "not found"}\n` +
      `**└─ Kỹ năng được trang bị**: [${
        profile?.EquippedSkills?.join(", ") || "not found"
      }]`
  });

  // ===== THÚ CƯNG =====
  if (pet?.id) {
    fields.push({
      name: "\u200b",
      value:
        "**┌  THÚ CƯNG**\n" +
        `**├─ Đang dùng?**: ${pet?.isSelected ? "Có" : "Không"}\n` +
        `**├─ ID thú cưng**: ${pet?.id ?? "not found"}\n` +
        `**├─ Kinh nghiệm**: ${pet?.exp ?? "not found"}\n` +
        `**└─ Cấp độ**: ${pet?.level ?? "not found"}`
    });
  }

  // ===== QUÂN ĐOÀN =====
  if (clan?.clanId) {
    fields.push({
      name: "\u200b",
      value:
        "**┌  QUÂN ĐOÀN**\n" +
        `**├─ Tên quân đoàn**: ${clan?.clanName ?? "not found"}\n` +
        `**├─ ID quân đoàn**: \`${clan?.clanId ?? "not found"}\`\n` +
        `**├─ Cấp**: ${clan?.clanLevel ?? "not found"}\n` +
        `**├─ Thành viên**: ${clan?.memberNum ?? "0"}/${clan?.capacity ?? "0"}\n` +
        "**└─ Thông tin chủ quân đoàn**:\n" +
        `    **├─ Tên**: ${captain?.nickname ?? "not found"}\n` +
        `    **├─ UID**: \`${captain?.accountId ?? "not found"}\`\n` +
        `    **├─ Cấp độ**: ${captain?.level ?? "not found"} (Exp: ${captain?.exp ?? "not found"})\n` +
        `    **├─ Lần đăng nhập gần nhất**: ${formatTimestamp(captain?.lastLoginAt)}\n` +
        `    **├─ Huy hiệu BP**: ${captain?.badgeCnt ?? "not found"}\n` +
        `    **├─ Rank BR**: ${captain?.rankingPoints ?? "not found"}\n` +
        `    **└─ Rank CS**: ${captain?.csRankingPoints ?? "not found"}`
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

console.log("TOKEN length:", process.env.TOKEN?.length);

client.login(process.env.TOKEN)
  .then(() => console.log("✅ Login thành công"))
  .catch(err => console.error("❌ Login lỗi:", err));



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