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
📦 Phiên bản bot: **v3.0.3**

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

        "❌ Sai cú pháp!\n\nVí dụ:\n```bash\n!like 12345678\n!info 12345678\n!check 12345678```"

      );

      setTimeout(() => {

        msg.delete().catch(() => {});

        warn.delete().catch(() => {});

      }, 10000);

      return;

    }

    const processing = await msg.reply({

      content: `🚀 Đang buff like cho UID **${uid}**...`,

      files: [loadingGIF],

    });

    const start = Date.now();

    try {

      const res = await fetch(`https://ff.mlbbai.com/like/?key=emon&uid=${uid}`);

      const data = await res.json();

      const elapsed = ((Date.now() - start) / 1000).toFixed(2);

      let embed;

      if (data.status === 1) {

        embed = new EmbedBuilder()

          .setTitle(`💗 Buff Like thành công cho ${data.PlayerNickname || uid}`)

          .setDescription(`✅ Lượt like đã được buff thành công!`)

          .addFields(

            { name: "👤 UID", value: String(data.UID || uid), inline: true },

            { name: "💗 Likes Trước", value: String(data.LikesbeforeCommand || 0), inline: true },

            { name: "💗 Likes Sau", value: String(data.LikesafterCommand || 0), inline: true },

            { name: "🚀 Likes Bởi API", value: String(data.LikesGivenByAPI || 0), inline: true },

            { name: "⏱️ Thời gian xử lý", value: `${elapsed}s`, inline: true }

          )

          .setColor("Green")

          .setFooter({ text: "Dev: Katari 📌" });

      } else if (data.status === 2) {

        embed = new EmbedBuilder()

          .setTitle("⚠️ UID đã được buff trong ngày")

          .setDescription(`UID **${uid}** đã được buff like trong ngày, hãy thử lại vào ngày mai.`)

          .setColor("Orange")

          .setFooter({ text: "Dev: Katari 📌" });

      } else {

        embed = new EmbedBuilder()

          .setTitle("❌ API trả về lỗi")

          .setDescription(`\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``)

          .setColor("Red")

          .setFooter({ text: "Dev: Katari 📌" });

      }

      await processing.edit({ content: null, embeds: [embed], files: [] });

    } catch (err) {

      console.error(err);

      processing.edit({ content: "🚫 Có lỗi khi kết nối đến API Like!", files: [] });

    }

  }

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

    // Gửi ảnh outfit riêng, hiển thị trực tiếp
    const outfitImg = `https://ffoutfitapis.vercel.app/outfit-image?uid=${uid}&region=${embed.data?.description?.region || "vn"}&key=99day`;
    await msg.channel.send({ embeds: [{ image: { url: outfitImg } }] });

  } catch (err) {
    console.error(err);
    processing.edit({ content: "⚠️ Không thể lấy dữ liệu người chơi!", files: [] });
  }
}

  // ======= LỆNH CHECK =======
if (command === "check") {
  const uid = args[0];
  if (!uid || isNaN(uid)) return;

  const processing = await msg.reply({ content: `🔍 Đang kiểm tra UID **${uid}**...`, files: [loadingGIF] });

  try {
    const resCheck = await fetch(`https://api-checkban.vercel.app/check?uid=${uid}`);
    const dataCheck = await resCheck.json();

    let region = "N/A";
    let lastLogin = "N/A";
    let nickname = "N/A";

    try {
      const resInfo = await fetch(`http://raw.thug4ff.com/info?uid=${uid}`);
      if (resInfo.ok) {
        const dataInfo = await resInfo.json();
        region = dataInfo?.basicInfo?.region || "N/A";
        lastLogin = formatTimestamp(dataInfo?.basicInfo?.lastLoginAt);
        nickname = dataInfo?.basicInfo?.nickname || "N/A";
      }
    } catch (err) {
      console.warn("Không lấy được region, last login hoặc nickname từ info:", err);
    }

    const isBanned = dataCheck["📊 Đang bị khóa?"] === true;
    const elapsed = ((Date.now() - processing.createdTimestamp) / 1000).toFixed(2);

    const embed = new EmbedBuilder()
      .setTitle(isBanned ? "⛔ Người chơi bị BAN" : "✅ Người chơi an toàn")
      .setColor(isBanned ? "Red" : "Green")
      .setDescription(`
👤 UID: ${uid}
💎 Biệt danh: ${nickname}
🌏 Khu vực: ${region}
⏰ Lần cuối đăng nhập: ${lastLogin}
⏱️ Thời gian xử lý: ${elapsed}s
`)
      .setImage(
        isBanned
          ? "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253290639370/standard-1.gif?ex=6902f403&is=6901a283&hm=93e432097c20c8fe7a25917f8c585fa6d4cdd3c397bdb44e554b1c36c70313bd&"
          : "https://cdn.discordapp.com/attachments/1227567434483896370/1352329253886361610/standard-2.gif?ex=6902f403&is=6901a283&hm=c29296c5f967f5d37d112bcf304d67ffa96e3248597d6f2edebb51883c6f9b93&"
      )
      .setFooter({ text: "Dev: Katari 📌" });

    await processing.edit({ content: null, embeds: [embed], files: [] });
  } catch (err) {
    console.error(err);
    processing.edit({ content: "🚫 Không thể kiểm tra người chơi!", files: [] });
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

  // Xóa tin nhắn người dùng sau 1s
    setTimeout(() => {
      msg.delete().catch(() => {});
    }, 1000);

  if (!token) {
    const warn = await msg.reply("❌ Sai cú pháp! Dùng: !get token");
    setTimeout(() => {
      msg.delete().catch(() => {});
      warn.delete().catch(() => {});
    }, 5000);
    return;
  }

  const loadingMsg = await msg.reply("⏳ Đang lấy JWT từ token...");

  try {
    // --- Lấy JWT từ token ---
    const jwtRes = await fetch(`https://xp-acc-jwt-v90.vercel.app/api/get_jwt?access_token=${encodeURIComponent(token)}`);
    const jwtData = await jwtRes.json();

    if (!jwtData?.BearerAuth) {
      const errEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription("❌ Không lấy được JWT từ token! Vui lòng kiểm tra lại token.")
        .setFooter({ text: "Dev Katari 📌" });
      const errMsg = await msg.channel.send({ embeds: [errEmbed] });
      setTimeout(() => {
        msg.delete().catch(() => {});
        errMsg.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
      }, 2000);
      return;
    }

    const jwt = jwtData.BearerAuth; // <- định nghĩa jwt ở đây

    // --- Gửi riêng (DM) trực tiếp JWT ---
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor("#00ff80")
        .setTitle("✅ JWT của bạn")
        .setDescription(
          `Chúc mừng! Bạn đã lấy JWT thành công.\n\nSử dụng cú pháp cập nhật bio:\n\`!bio "jwt" "newbio"\`\n\n➡️ Dùng lệnh bio ở kênh: <#1438241744893382857>`
        )
        .addFields({ name: "JWT", value: `${jwt}` })
        .setFooter({ text: "Dev Katari 📌" })
        .setTimestamp();

      await msg.author.send({ embeds: [dmEmbed] });

      const announceChannel = await msg.guild.channels.fetch("1438791394423476337");
      if (announceChannel) {
        announceChannel.send(
          `<@${msg.author.id}>, bạn hãy check tin nhắn riêng mà tôi đã gửi cho bạn ✅ để update long bio.`
        );
      }

      // Xóa tin nhắn gốc + loading sau 5s
      setTimeout(() => {
        msg.delete().catch(() => {});
        loadingMsg.delete().catch(() => {});
      }, 2000);

    } catch (dmErr) {
      console.error(dmErr);
      const errEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription("❌ Không thể gửi DM. Vui lòng bật tin nhắn riêng từ server này.")
        .setFooter({ text: "Dev Katari 📌" });
      await msg.channel.send({ embeds: [errEmbed] });
    }

  } catch (err) {
    console.error(err);
    const errEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setDescription("❌ Có lỗi khi kết nối đến API hoặc token không hợp lệ!")
      .setFooter({ text: "Dev Katari 📌" });
    await msg.channel.send({ embeds: [errEmbed] });
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

   // ===================== LỆNH !GHOST (tối giản) =====================
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

  // Tin nhắn loading đơn giản
  const loading = await msg.reply(`> 👻 Đang ghost đến teamcode **${code}**...`);

  try {
    // Gọi API
    const url = `https://ghost-code-amph.onrender.com/execute_command_all?command=/bngx=${code}`;
    const res = await axios.get(url);
    const results = res.data?.results || {};

    // Embed kết quả
    let description = `> Những tài khoản đã ghost trong teamcode **${code}**\n`;
    description += `> —————————————————————————————————————————————————————————————————————————\n`;

    const embed = new EmbedBuilder()
      .setTitle("👻 Ghost TeamCode")
      .setColor("#00A2FF")
      .setDescription(description)
      .setTimestamp()
      .setFooter({ text: "dev Katari📌" });

    for (const id in results) {
      let name = "Không tìm thấy";
      const match = results[id]?.match(/Name:\s*(.*)$/);
      if (match?.[1]) name = match[1].trim();

      embed.addFields({
        name: `> 🆔 ID: ${id}`,
        value: `> 👤 Tên: **${name}**`,
        inline: false
      });
    }

    // Hiển thị embed đầy đủ
    await loading.edit({
      content: `> 👻 Ghost hoàn tất teamcode **${code}**`,
      embeds: [embed]
    });

  } catch (err) {
    // Embed lỗi
    const errorEmbed = new EmbedBuilder()
      .setTitle("⚠️ Ghost TeamCode - Lỗi")
      .setColor("#FF0000")
      .setDescription(
        `> ❌ Đã xảy ra lỗi khi ghost teamcode **${code}**\n` +
        `> Vui lòng thử lại sau hoặc liên hệ dev Katari📌`
      )
      .setTimestamp()
      .setFooter({ text: "Dev Katari📌" });

    await loading.edit({ content: null, embeds: [errorEmbed] });
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

    const apiUrl =
        command === "team5"
            ? `https://ff-community-apiemoteessss.onrender.com/5?uid=${uid}&region=VN`
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

    // === Map tên hành động → emote ID (dùng chung với !emotes) ===
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

    // Nếu nhập tên → chuyển thành ID, không có → dùng trực tiếp như ID
    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // Loading
    const loadingMsg = await msg.reply(
        `⏳ **Đang gửi emote ${emoteId} đến UID ${uid}...**`
    );

    // API y hệt bạn đang dùng
    const apiUrl =
        `https://ff-community-apiemoteessss.onrender.com/emote?teamcode=${teamcode}` +
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

   // ===================== LỆNH !EMOTES =====================
if (command === "emotes") {
    const teamcode = args[0];
    const uid1 = args[1];
    const uid2 = args[2];
    const uid3 = args[3];
    const uid4 = args[4];
    let emoteInput = args[5]; // có thể là tên hoặc ID

    // ❌ Sai cú pháp  
    if (!teamcode || !uid1 || !emoteInput) {  
        const errMsg = await msg.reply(  
            "> ❌ Sai cú pháp!\n" +  
            "> Ví dụ: `!emotes 1234567 12345678 23456789 34567890 45678901 m60`"  
        );  
        setTimeout(() => { errMsg.delete().catch(() => {}); msg.delete().catch(() => {}); }, 6000);  
        return;  
    }  

    // Map tên hành động → emote ID
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
        // bạn có thể thêm tiếp ở đây
    };

    // Nếu người dùng nhập tên, chuyển sang ID
    const emoteId = emoteMap[emoteInput.toLowerCase()] || emoteInput;

    // Tin nhắn loading  
    const loadingMsg = await msg.reply(  
        `⏳ **Đang gửi emote ${emoteId} đến team ${teamcode}...**`  
    );  

    // Tạo URL API  
    const apiUrl =  
        `https://ff-community-apiemoteessss.onrender.com/emote?teamcode=${teamcode}` +  
        `&uid1=${uid1}` +  
        `${uid2 ? `&uid2=${uid2}` : ""}` +  
        `${uid3 ? `&uid3=${uid3}` : ""}` +  
        `${uid4 ? `&uid4=${uid4}` : ""}` +  
        `&emote_id=${emoteId}`;  

    try {  
        const res = await fetch(apiUrl);  
        if (!res.ok) throw new Error("API lỗi");  

        const data = await res.json();  

        // Chuẩn bị danh sách UID  
        const listUID =  
            `• ${uid1}\n` +  
            `${uid2 ? `• ${uid2}\n` : ""}` +  
            `${uid3 ? `• ${uid3}\n` : ""}` +  
            `${uid4 ? `• ${uid4}\n` : ""}`;  

        // Embed thành công  
        const embed = new EmbedBuilder()  
            .setColor(0x00c3ff)  
            .setTitle("🎭 Gửi Emote Thành Công!")  
            .setDescription(  
                `> Người dùng: <@${msg.author.id}>\n` +  
                `> Team code: **${teamcode}**\n` +  
                `> Emote ID: **${emoteId}**\n\n` +  
                `👥 **Danh sách UID:**\n${listUID}\n` +  
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
    const res = await fetch(`http://raw.thug4ff.com/info?uid=${uid}`);
    if (res.ok) baseData = await res.json();
  } catch (err) {
    console.warn("Không lấy được baseData:", err);
  }

  const basic = baseData?.basicInfo || {};
  const clan = baseData?.clanBasicInfo || {};
  const captain = baseData?.captainBasicInfo || {};
  const credit = baseData?.creditScoreInfo || {};
  const pet = baseData?.petInfo || {};
  const profile = baseData?.profileInfo || {};
  const social = baseData?.socialInfo || {};

  const color = getRankColor(basic.rank);
  const bannerImg =
    'https://gmg-avatar-banner.vercel.app/Gmg-avatar-banner?uid=' +
    uid +
    '&region=' +
    (basic?.region || 'vn') +
    '&key=IDK';

  // 🇻🇳 Hiển thị khu vực có cả cờ và tên
  const regionMap = {
    VN: '🇻🇳 Vietnam',
    ID: '🇮🇩 Indonesia',
    TH: '🇹🇭 Thailand',
    SG: '🇸🇬 Singapore',
    MY: '🇲🇾 Malaysia',
    PH: '🇵🇭 Philippines',
    TW: '🇹🇼 Taiwan',
    KR: '🇰🇷 Korea',
    PK: '🇵🇰 Pakistan',
    BD: '🇧🇩 Bangladesh',
    IN: '🇮🇳 India',
    BR: '🇧🇷 Brazil',
    US: '🇺🇸 United States',
    RU: '🇷🇺 Russia',
    TR: '🇹🇷 Turkey',
    EG: '🇪🇬 Egypt',
    SA: '🇸🇦 Saudi Arabia',
    MEA: '🌍 Middle East & Africa',
    LATAM: '🌎 Latin America',
    EU: '🇪🇺 Europe',
    GLOBAL: '🌐 Global',
  };
  const regionText = regionMap[basic?.region?.toUpperCase()] || '🌏 Unknown';

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle('🔎 Thông tin người chơi: ' + (basic?.nickname || uid))
    .setAuthor({
      name: user.username,
      iconURL: user.displayAvatarURL({ dynamic: true }),
    })
    .setImage(bannerImg)
    .setFooter({ text: 'Dev: Katari 📌' });

  // Các field chung
  const fields = [
    {
      name: '👤 ACCOUNT BASIC INFO',
      value:
        '**┌  THÔNG TIN CƠ BẢN**\n' +
        '**├─ Tên**: ' +
        (basic?.nickname ?? 'N/A') +
        '\n' +
        '**├─ UID**: `' +
        (basic?.accountId ?? 'N/A') +
        '`\n' +
        '**├─ Cấp độ**: ' +
        (basic?.level ?? 'N/A') +
        ' (Exp: ' +
        (basic?.exp ?? 'N/A') +
        ')\n' +
        '**├─ Khu vực**: ' +
        regionText +
        '\n' +
        '**├─ Lượt thích**: ' +
        (basic?.liked ?? 'N/A') +
        '\n' +
        '**├─ Điểm uy tín**: ' +
        (credit?.creditScore ?? 'N/A') +
        '\n' +
        '**└─ Chữ ký**: ' +
        (social?.signature || 'Không có'),
    },
    {
      name: '📊 ACCOUNT ACTIVITY',
      value:
        '**┌  HOẠT ĐỘNG TÀI KHOẢN**\n' +
        '**├─ Phiên bản gần nhất**: ' +
        (basic?.releaseVersion ?? 'N/A') +
        '\n' +
        '**├─ Huy hiệu BP hiện tại**: ' +
        (basic?.badgeCnt ?? 'N/A') +
        '\n' +
        '**├─ Hạng BR**: ' +
        (basic?.rankingPoints ?? 'N/A') +
        '\n' +
        '**├─ Hạng CS**: ' +
        (basic?.csRankingPoints ?? 'N/A') +
        '\n' +
        '**├─ Ngày tạo**: ' +
        formatTimestamp(basic?.createAt) +
        '\n' +
        '**└─ Lần đăng nhập gần nhất**: ' +
        formatTimestamp(basic?.lastLoginAt),
    },
    {
      name: '📦 ACCOUNT OVERVIEW',
      value:
        '**┌  TỔNG QUAN TÀI KHOẢN**\n' +
        '**├─ Avatar ID**: ' +
        (profile?.avatarId ?? 'N/A') +
        '\n' +
        '**├─ Banner ID**: ' +
        (basic?.bannerId ?? 'N/A') +
        '\n' +
        '**├─ Pin ID**: ' +
        (basic?.pinId ?? 'Không có') +
        '\n' +
        '**└─ Kỹ năng trang bị**: [' +
        (profile?.equipedSkills?.join(', ') || 'Không có') +
        ']',
    },
  ];

  // 🐾 Thêm phần PET DETAILS nếu người chơi có pet
  if (pet?.name) {
    fields.push({
      name: '🐾 PET DETAILS',
      value:
        '**┌  CHI TIẾT THÚ CƯNG**\n' +
        '**├─ Đã trang bị?**: ' +
        (pet?.isSelected ? 'Có' : 'Không') +
        '\n' +
        '**├─ Tên thú cưng**: ' +
        (pet?.name ?? 'N/A') +
        '\n' +
        '**├─ Cấp độ**: ' +
        (pet?.level ?? 'N/A') +
        '\n' +
        '**├─ Kinh nghiệm**: ' +
        (pet?.exp ?? 'N/A') +
        '\n' +
        '**└─ Skin ID**: ' +
        (pet?.skinId ?? 'N/A'),
    });
  }

  // 🛡️ Thêm phần quân đoàn CHỈ khi người chơi có trong clan
  if (clan?.clanId && clan.clanId !== 0) {
    fields.push({
      name: '🏰 CLAN INFO',
      value:
        '**┌  THÔNG TIN QUÂN ĐOÀN**\n' +
        '**├─ Tên quân đoàn**: ' +
        (clan?.clanName ?? 'N/A') +
        '\n' +
        '**├─ ID Quân đoàn**: `' +
        (clan?.clanId ?? 'N/A') +
        '`\n' +
        '**├─ Cấp quân đoàn**: ' +
        (clan?.clanLevel ?? 'N/A') +
        '\n' +
        '**├─ Thành viên hiện tại**: ' +
        (clan?.memberNum ?? 'N/A') +
        '/' +
        (clan?.capacity ?? 'N/A') +
        '\n' +
        '**└─ Chủ quân đoàn**:\n' +
        '    **├─ Tên**: ' +
        (captain?.nickname ?? 'N/A') +
        '\n' +
        '    **├─ UID**: `' +
        (captain?.accountId ?? 'N/A') +
        '`\n' +
        '    **├─ Cấp**: ' +
        (captain?.level ?? 'N/A') +
        ' (Exp: ' +
        (captain?.exp ?? 'N/A') +
        ')\n' +
        '    **├─ Lần đăng nhập**: ' +
        formatTimestamp(captain?.lastLoginAt) +
        '\n' +
        '    **├─ Danh hiệu**: ' +
        (captain?.title ?? 'N/A') +
        '\n' +
        '    **├─ Huy hiệu BP**: ' +
        (captain?.badgeCnt ?? 'N/A') +
        '\n' +
        '    **├─ Hạng BR**: ' +
        (captain?.rankingPoints ?? 'N/A') +
        '\n' +
        '    **└─ Hạng CS**: ' +
        (captain?.csRankingPoints ?? 'N/A'),
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