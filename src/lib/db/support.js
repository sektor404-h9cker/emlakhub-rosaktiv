/**
 * Тикеты поддержки. Одна лента на обращение:
 * сообщение инвестора и ответ сотрудника хранятся в Postgres, не в браузере.
 */
import prisma from "@/lib/db/prisma";

const ticketInclude = {
  user: {
    select: { email: true, displayName: true, firstName: true, lastName: true },
  },
  messages: { orderBy: { createdAt: "asc" } },
};

export function mapSupportTicket(row) {
  const name =
    row.user.displayName ||
    [row.user.firstName, row.user.lastName].filter(Boolean).join(" ") ||
    row.user.email;
  const messages = row.messages.map((m) => ({
    id: m.id,
    from: m.authorRole === "agent" ? "agent" : "user",
    text: m.body,
    at: m.createdAt.getTime(),
    agentEmail: m.authorRole === "agent" ? m.authorEmail : null,
    media: m.attachment
      ? {
          name: m.attachmentName || "file",
          type: m.attachmentType || "",
          dataUrl: m.attachment,
        }
      : null,
  }));
  const first = messages[0]?.text || "";
  return {
    id: row.id,
    subject: row.subject,
    topic: row.topic,
    lotId: row.lotId,
    status: row.status,
    level: row.level,
    userEmail: row.user.email,
    userName: name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    titleAz: row.subject,
    titleRu: row.subject,
    bodyAz: first,
    bodyRu: first,
    messages,
  };
}

export async function listSupportTickets({ userId, all }) {
  const rows = await prisma.supportTicket.findMany({
    where: all ? undefined : { userId },
    orderBy: { updatedAt: "desc" },
    include: ticketInclude,
    take: 100,
  });
  return rows.map(mapSupportTicket);
}

export async function getSupportTicket(id) {
  const row = await prisma.supportTicket.findUnique({
    where: { id },
    include: ticketInclude,
  });
  return row;
}

export async function createSupportTicket({ userId, email, subject, topic, lotId, body }) {
  const row = await prisma.supportTicket.create({
    data: {
      userId,
      subject,
      topic: topic || "other",
      lotId: lotId || null,
      status: "open",
      messages: {
        create: {
          authorRole: "user",
          authorEmail: email,
          body,
        },
      },
    },
    include: ticketInclude,
  });
  return mapSupportTicket(row);
}

export async function addSupportMessage({ ticketId, role, email, body, attachment }) {
  await prisma.supportMessage.create({
    data: {
      ticketId,
      authorRole: role,
      authorEmail: email,
      body,
      attachment: attachment?.dataUrl || null,
      attachmentName: attachment?.name || null,
      attachmentType: attachment?.type || null,
    },
  });
  const status = role === "agent" ? "waiting" : "open";
  const row = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
    include: ticketInclude,
  });
  return mapSupportTicket(row);
}

export async function updateSupportTicket(id, patch) {
  const data = {};
  if (patch.status) data.status = patch.status;
  if (patch.level) data.level = patch.level;
  const row = await prisma.supportTicket.update({
    where: { id },
    data,
    include: ticketInclude,
  });
  return mapSupportTicket(row);
}

async function messageOnTicket(ticketId, messageId) {
  const row = await prisma.supportMessage.findFirst({
    where: { id: messageId, ticketId },
  });
  if (!row) {
    const err = new Error("Not found");
    err.status = 404;
    throw err;
  }
  return row;
}

export async function updateSupportMessage(ticketId, messageId, body) {
  await messageOnTicket(ticketId, messageId);
  await prisma.supportMessage.update({
    where: { id: messageId },
    data: { body },
  });
}

export async function deleteSupportMessage(ticketId, messageId) {
  await messageOnTicket(ticketId, messageId);
  await prisma.supportMessage.delete({ where: { id: messageId } });
}

export async function deleteSupportTicket(id) {
  await prisma.supportTicket.delete({ where: { id } });
}
