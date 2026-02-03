const {
  Client,
  GatewayIntentBits,
  Partials,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

/* ================= CONFIGURAÇÕES ================= */

const TOKEN = process.env.TOKEN;

const CANAL_PEDIR_SET = "1468069332973260983";
const CANAL_APROVAR_SET = "1468069332826194120";

const CARGO_MEMBRO = "1468069332239257692";   // cargo após aprovação
const CARGO_SEM_SET = "1468069332239257690";  // cargo inicial

/* ================================================ */

/* ===== EVENTO READY (CORRIGIDO) ===== */
client.once(Events.ClientReady, async client => {
  console.log(`🤖 Bot online como ${client.user.tag}`);

  const canal = await client.channels.fetch(CANAL_PEDIR_SET);

  const embed = new EmbedBuilder()
    .setTitle("📋 Registro de Set")
    .setDescription("Clique no botão abaixo para iniciar seu registro.")
    .setColor("Blue");

  const botao = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("iniciar_registro")
      .setLabel("📝 Iniciar Registro")
      .setStyle(ButtonStyle.Primary)
  );

  await canal.send({ embeds: [embed], components: [botao] });
});

/* ===== INTERAÇÕES ===== */
client.on(Events.InteractionCreate, async interaction => {

  /* ========= ABRIR MODAL ========= */
  if (interaction.isButton() && interaction.customId === "iniciar_registro") {
    const modal = new ModalBuilder()
      .setCustomId("modal_registro")
      .setTitle("Registro de Set");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("nickname")
          .setLabel("Nickname")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("id")
          .setLabel("ID")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("idade")
          .setLabel("Idade")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
      )
    );

    return interaction.showModal(modal);
  }

  /* ========= ENVIO DO REGISTRO ========= */
  if (interaction.isModalSubmit() && interaction.customId === "modal_registro") {
    const nickname = interaction.fields.getTextInputValue("nickname");
    const id = interaction.fields.getTextInputValue("id");
    const idade = interaction.fields.getTextInputValue("idade");

    const embed = new EmbedBuilder()
      .setTitle("📥 Pedido de Set")
      .setColor("Yellow")
      .addFields(
        { name: "👤 Usuário", value: `<@${interaction.user.id}>` },
        { name: "Nickname", value: nickname },
        { name: "ID", value: id },
        { name: "Idade", value: idade }
      )
      .setTimestamp();

    const botoes = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`aceitar_${interaction.user.id}`)
        .setLabel("✅ Aceitar")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`recusar_${interaction.user.id}`)
        .setLabel("❌ Recusar")
        .setStyle(ButtonStyle.Danger)
    );

    const canal = await client.channels.fetch(CANAL_APROVAR_SET);
    await canal.send({ embeds: [embed], components: [botoes] });

    await interaction.reply({
      content: "✅ Seu pedido foi enviado para aprovação.",
      ephemeral: true
    });
  }

  /* ========= ACEITAR ========= */
  if (interaction.isButton() && interaction.customId.startsWith("aceitar_")) {
    const userId = interaction.customId.split("_")[1];
    const membro = await interaction.guild.members.fetch(userId);

    const embedOriginal = interaction.message.embeds[0];
    const nickname = embedOriginal.fields.find(f => f.name === "Nickname").value;
    const id = embedOriginal.fields.find(f => f.name === "ID").value;

    await membro.setNickname(`${nickname} | ${id}`);

    if (membro.roles.cache.has(CARGO_SEM_SET)) {
      await membro.roles.remove(CARGO_SEM_SET);
    }

    await membro.roles.add(CARGO_MEMBRO);

    const embedAprovado = new EmbedBuilder()
      .setTitle("✅ Set Aprovado")
      .setColor("Green")
      .addFields(
        { name: "👤 Usuário", value: `<@${userId}>` },
        { name: "🆔 Nick", value: `${nickname} | ${id}` },
        { name: "🛡️ Aprovado por", value: `<@${interaction.user.id}>` }
      )
      .setTimestamp();

    await interaction.update({
      embeds: [embedAprovado],
      components: []
    });
  }

  /* ========= RECUSAR ========= */
  if (interaction.isButton() && interaction.customId.startsWith("recusar_")) {
    const userId = interaction.customId.split("_")[1];

    const embedRecusado = new EmbedBuilder()
      .setTitle("❌ Set Recusado")
      .setColor("Red")
      .addFields(
        { name: "👤 Usuário", value: `<@${userId}>` },
        { name: "🛡️ Recusado por", value: `<@${interaction.user.id}>` }
      )
      .setTimestamp();

    await interaction.update({
      embeds: [embedRecusado],
      components: []
    });
  }
});

client.login(TOKEN);
