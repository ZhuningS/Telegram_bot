const fs = require('fs');
const Telegraf = require('telegraf');
const Telegram = require('telegraf/telegram')
const RedisSession = require('telegraf-session-redis')
const Extra = require('telegraf/extra');
const Markup = require('telegraf/markup');
const Stage = require('telegraf/stage')
const Scene = require('telegraf/scenes/base')
const redis = require("redis");
const {promisify} = require('util');

const databaseconfig = require(__dirname + '/database.json');

const redisClient = redis.createClient(databaseconfig.redisPort, databaseconfig.redisHost, {
  'password': databaseconfig.redisKey
});

const getAsync = promisify(redisClient.get).bind(redisClient);

const setAsync = promisify(redisClient.set).bind(redisClient);

const deleteAsync = promisify(redisClient.del).bind(redisClient);

const config = require(__dirname + '/config.json');

const bot = new Telegraf(config.BOT_TOKEN)

// bot.telegram.deleteWebhook()

bot.telegram.setWebhook(config.WEBHOOK)

require('http')
  .createServer(bot.webhookCallback('/secret-path'))
  .listen(process.env.PORT)

const telegram = new Telegram(config.BOT_TOKEN)

telegram.getMe().then((...args) => {
  console.log('here is ' + JSON.stringify(args));
});

const welcomeMarkdown = `这里是 @awesomeopensource  投稿机器人，点击下面的'我要投稿'按钮开始投稿。`;

const aboutMarkdown = `*关于此Bot*
这里是此频道的投稿机器人。提供交流，反馈功能。



const startSubmitButtonAction = '我要投稿!';
const aboutButtonAction = '关于';
const cancelButtonAction = '取消';
const backButtonAction = '返回上一步';
const enterButtonAction = '确定投稿';
const unnamedButtonAction = '匿名：关';
const unnamedWarningText = '已匿名，但管理员仍然有可能获得你的ID！';
const namedButtonAction = '匿名：开';
const passButtonAction = '跳过';
const publicButtonAction = '发布';
const rejectButtonAction = '驳回';
const ignoreButtonAction = '忽略';
const fetchSourcecodeButtonAction = '获取源码';
const step1Text = '输入你想要推荐的文章或者内容名称：';
const step2Text = '输入链接：';
const step3Text = '一段文字简短介绍一下：';
const step4Text = '你还可以插入一个关于此内容的相关图片或者音视频，必须是链接(可选)：';
const step5Text = '最后请确认你的投稿：';
const rejectStep1Text = '输入驳回原因：';
const successText = '投稿成功，谢谢投稿！';
const canceledText = '已取消操作';
const pubilcText = '这条投稿已经被接受并发送。';
const rejectedText = '投稿被拒绝。原因：';
const adminRejectedText = '驳回成功';
const messageHTML = (title, link, content, anchorname, attachlink) => {
  attachlink = attachlink ? '<a href="' + attachlink + '">\u200B</a>' : '';
  anchorname = anchorname ? `\n\n感谢 ${anchorname} 的投稿` : '';
  return attachlink + `<a href="${link}">${title}</a>\n${content}` + anchorname
};

function randomString(length, charSet) {
  var result = [];
  length = length || 16;
  charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  while (length--) {
    result.push(charSet[Math.floor(Math.random() * charSet.length)]);
  }
  return result.join('');
}

async function submit(messageID) {
  const messageText = await getAsync('messageText' + messageID);
  if (messageText) {
    const {message_id: adminmessageid} = await telegram.sendMessage(config.ADMIN_ID, messageText, Extra.HTML().markup(
      Markup.inlineKeyboard([[
        Markup.callbackButton(publicButtonAction, publicButtonAction + ' ' + messageID),
        Markup.callbackButton(rejectButtonAction, rejectButtonAction + ' ' + messageID),
        Markup.callbackButton(ignoreButtonAction, ignoreButtonAction + ' ' + messageID),
      ]])
    ));
    await setAsync('messageAdminMessageID' + messageID, adminmessageid);
  }
}

const welcomeMarkup = Extra.markup(
  Markup.keyboard([
    [startSubmitButtonAction, aboutButtonAction]
  ])
);

const aboutInlineMarkup = Extra.markup(
  Markup.inlineKeyboard([
    Markup.callbackButton(fetchSourcecodeButtonAction, fetchSourcecodeButtonAction)
  ])
)

const submit1Scene = (() => {
  const step = 1;
  const scene = new Scene('submit-' + step)
  const markup = Extra.markup(
    Markup.keyboard([
      cancelButtonAction
    ])
  );
  scene.enter(async (ctx) => await ctx.reply(step1Text, markup));
  scene.on('text', (ctx) => {
    ctx.session.message = [ctx.message.text];
    ctx.scene.enter('submit-' + (step + 1))
  });
  return scene;
})();

const submit2Scene = (() => {
  const step = 2;
  const scene = new Scene('submit-' + step)
  const markup = Extra.markup(
    Markup.keyboard([
      [cancelButtonAction, backButtonAction]
    ])
  );
  scene.enter(async (ctx) => await ctx.reply(step2Text, markup))
  scene.hears(backButtonAction, (ctx) => ctx.scene.enter('submit-' + (step - 1)), markup);
  scene.on('message', (ctx) => {
    ctx.session.message[1] = ctx.message.text;
    ctx.scene.enter('submit-' + (step + 1))
  });
  return scene;
})();

const submit3Scene = (() => {
  const step = 3;
  const scene = new Scene('submit-' + step)
  const markup = Extra.markup(
    Markup.keyboard([
      [cancelButtonAction, backButtonAction]
    ])
  );
  scene.enter(async (ctx) => await ctx.reply(step3Text, markup))
  scene.hears(backButtonAction, (ctx) => ctx.scene.enter('submit-' + (step - 1)), markup);
  scene.on('message', (ctx) => {
    ctx.session.message[2] = ctx.message.text;
    ctx.scene.enter('submit-' + (step + 1))
  });
  return scene;
})();

const submit4Scene = (() => {
  const step = 4;
  const scene = new Scene('submit-' + step)
  const markup = Extra.markup(
    Markup.keyboard([
      [cancelButtonAction, backButtonAction, passButtonAction]
    ])
  );
  scene.enter(async (ctx) => await ctx.reply(step4Text, markup))
  scene.hears(backButtonAction, (ctx) => ctx.scene.enter('submit-' + (step - 1)), markup);
  scene.hears(passButtonAction, (ctx) => ctx.scene.enter('submit-' + (step + 1)), markup);
  scene.on('message', (ctx) => {
    ctx.session.message[3] = ctx.message.text;
    ctx.scene.enter('submit-' + (step + 1))
  });
  return scene;
})();

const submit5Scene = (() => {
  const step = 5;
  const scene = new Scene('submit-' + step)
  const markup = Extra.markup(
    Markup.keyboard([
      [cancelButtonAction, backButtonAction]
    ])
  );

  scene.enter(async (ctx) => {
    const message = ctx.session.message;
    const anchorname = ctx.message.chat.username ? 
      ('@' + ctx.message.chat.username) : 
      (
        ctx.message.chat.last_name ? 
        ctx.message.chat.last_name + ' ' + ctx.message.chat.first_name : 
        ctx.message.chat.first_name
      )
    const HTML = messageHTML(message[0], message[1], message[2], anchorname, message[3]);
    const messageID = randomString(16);

    await ctx.reply(step5Text, markup);
    
    const {message_id: submitmessageid} = await ctx.replyWithHTML(HTML, Extra.markup(
      Markup.inlineKeyboard([
        Markup.callbackButton(unnamedButtonAction, unnamedButtonAction + ' ' + messageID),
        Markup.callbackButton(enterButtonAction, enterButtonAction + ' ' + messageID)
      ])
    ));
    await setAsync('messageText' + messageID, HTML);
    await setAsync('messageAnchor' + messageID, ctx.message.chat.id);
    await setAsync('messageAnchorName' + messageID, anchorname);
    await setAsync('messageSubmitMessageID' + messageID, submitmessageid);
  });

  scene.hears(backButtonAction, (ctx) => ctx.scene.enter('submit-' + (step - 1)), markup);
  scene.action(new RegExp(`^${enterButtonAction} (\\w{16})$`), async (ctx) => {
    ctx.session.message = null;
    const messageID = ctx.match[1];
    await ctx.editMessageText(await getAsync('messageText' + messageID), Extra.HTML());
    await ctx.reply(successText, welcomeMarkup);
    await submit(messageID);
    await ctx.answerCbQuery();
    ctx.scene.leave();
  });
  scene.action(new RegExp(`^${unnamedButtonAction} (\\w{16})$`), async (ctx) => {
    const message = ctx.session.message;
    const messageID = ctx.match[1];
    const HTML = messageHTML(message[0], message[1], message[2], undefined, message[3]);
    await ctx.editMessageText(HTML, Extra.HTML().markup(
      Markup.inlineKeyboard([
        Markup.callbackButton(namedButtonAction, namedButtonAction + ' ' + messageID),
        Markup.callbackButton(enterButtonAction, enterButtonAction + ' ' + messageID)
      ])
    ));
    await setAsync('messageText' + messageID, HTML);
    await ctx.answerCbQuery(unnamedWarningText);
  });

  scene.action(new RegExp(`^${namedButtonAction} (\\w{16})$`), async (ctx) => {
    const message = ctx.session.message;
    const messageID = ctx.match[1];
    const anchorname = await getAsync('messageAnchorName' + messageID)
    const HTML = messageHTML(message[0], message[1], message[2], anchorname, message[3]);
    await ctx.editMessageText(HTML, Extra.HTML().markup(
      Markup.inlineKeyboard([
        Markup.callbackButton(unnamedButtonAction, unnamedButtonAction + ' ' + messageID),
        Markup.callbackButton(enterButtonAction, enterButtonAction + ' ' + messageID)
      ])
    ));
    await setAsync('messageText' + messageID, HTML);
    await ctx.answerCbQuery();
  });
  return scene;
})();

const rejectScene = (() => {
  const step = 1;
  const scene = new Scene('reject-' + step)
  const markup = Extra.markup(
    Markup.keyboard([
      [cancelButtonAction]
    ])
  );
  scene.enter(async (ctx) => await ctx.reply(rejectStep1Text, markup))
  scene.on('message', async (ctx) => {
    const messageID = ctx.session.rejectMessageID;
    const messageAnchor = await getAsync('messageAnchor' + messageID);
    const messageSubmitMessageID = await getAsync('messageSubmitMessageID' + messageID);
    const messageText = await getAsync('messageText' + messageID);
    const adminMessageID = await getAsync('messageAdminMessageID' + messageID);
    await ctx.telegram.editMessageText(ctx.chat.id, adminMessageID, undefined, messageText, Extra.HTML());
    await ctx.telegram.sendMessage(messageAnchor, rejectedText + ctx.message.text, Extra.inReplyTo(messageSubmitMessageID));
    await deleteAsync('messageText' + messageID, 'messageAnchor' + messageID, 'messageAnchorName' + messageID, 'messageSubmitMessageID' + messageID, 'messageAdminMessageID' + messageID, 'messageAdminMessageID' + messageID);
    await ctx.reply(adminRejectedText, welcomeMarkup);
    ctx.scene.leave();
  });
  return scene;
})();

const stage = new Stage([submit1Scene, submit2Scene, submit3Scene, submit4Scene, submit5Scene, rejectScene])
stage.hears(cancelButtonAction, (ctx) => {
  ctx.reply(canceledText, welcomeMarkup);
  ctx.scene.leave();
})

const session = new RedisSession({
  store: {
    port: databaseconfig.redisPort,
    host: databaseconfig.redisHost,
    password: databaseconfig.redisKey
  }
});

bot.use(session.middleware())
bot.use(stage.middleware())

bot.start((ctx) => ctx.replyWithMarkdown(welcomeMarkdown, welcomeMarkup));
bot.help((ctx) => ctx.replyWithMarkdown(welcomeMarkdown, welcomeMarkup));
bot.hears(aboutButtonAction, (ctx) => ctx.replyWithMarkdown(aboutMarkdown, aboutInlineMarkup));

bot.hears(startSubmitButtonAction, (ctx) => ctx.scene.enter('submit-1'))

bot.action(new RegExp(`^${publicButtonAction} (\\w{16})$`), async (ctx) => {
  const messageID = ctx.match[1];
  const messageText = await getAsync('messageText' + messageID);
  if (messageText) {
    const messageAnchor = await getAsync('messageAnchor' + messageID);
    const messageSubmitMessageID = await getAsync('messageSubmitMessageID' + messageID);
    await ctx.telegram.sendMessage(config.CHANNEL_ID, messageText, Extra.HTML());
    await ctx.editMessageText(messageText, Extra.HTML());
    await ctx.telegram.sendMessage(messageAnchor, pubilcText, Extra.inReplyTo(messageSubmitMessageID));
    await ctx.answerCbQuery();
    await deleteAsync('messageText' + messageID, 'messageAnchor' + messageID, 'messageAnchorName' + messageID, 'messageSubmitMessageID' + messageID, 'messageAdminMessageID' + messageID);
  }
});

bot.action(new RegExp(`^${rejectButtonAction} (\\w{16})$`), async (ctx) => {
  const messageID = ctx.match[1];
  ctx.session.rejectMessageID = messageID;
  const messageText = await getAsync('messageText' + messageID);
  if (messageText) {
    ctx.scene.enter('reject-1')
    await ctx.answerCbQuery();
  }
});

bot.action(new RegExp(`^${ignoreButtonAction} (\\w{16})$`), async (ctx) => {
  const messageID = ctx.match[1];
  const messageText = await getAsync('messageText' + messageID);
  if (messageText) {
    await ctx.editMessageText(messageText, Extra.HTML());
    await ctx.answerCbQuery();
    await deleteAsync('messageText' + messageID, 'messageAnchor' + messageID, 'messageAnchorName' + messageID, 'messageSubmitMessageID' + messageID, 'messageAdminMessageID' + messageID);
  }
});

bot.action(fetchSourcecodeButtonAction, async (ctx) => {
  await ctx.replyWithDocument({
    source: fs.createReadStream(__filename),
    filename: 'awesomeopensource_bot.js'
  });
  await ctx.answerCbQuery();
})

bot.catch((err) => {
  console.log('Ooops!', err)
})

// bot.startPolling()