// src/data/slots.js
const { findCardById } = require("./cards");

// Génère les slots du mois courant
function generateMonthSlots(baseDate) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth(); // 0-11

  const firstDay = new Date(year, month, 1);
  const nextMonth = new Date(year, month + 1, 1);

  const slots = [];
  for (let d = new Date(firstDay); d < nextMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
    slots.push({ date: dateStr, reservedBy: undefined });
  }

  // Demo : 2 jours déjà pris
  if (slots[2]) slots[2].reservedBy = "card02";
  if (slots[5]) slots[5].reservedBy = "card01";

  return slots;
}

// Unique tableau en mémoire (mois courant)
const SLOTS = generateMonthSlots(new Date());

function getSlotByDate(dateStr) {
  return SLOTS.find((s) => s.date === dateStr);
}

function setSlotReservation(dateStr, cardIdOrNull) {
  const slot = getSlotByDate(dateStr);
  if (!slot) return null;
  slot.reservedBy = cardIdOrNull || undefined;
  return slot;
}

function isSlotFreeOrMine(dateStr, cardId) {
  const slot = getSlotByDate(dateStr);
  if (!slot) return false;
  if (!slot.reservedBy) return true;
  return slot.reservedBy === cardId;
}

function describeSlot(slot) {
  if (!slot.reservedBy) return "Libre";
  const card = findCardById(slot.reservedBy);
  if (!card) return `Réservé (${slot.reservedBy})`;
  const digits = card.id.replace(/\D/g, "") || card.id;
  return `${card.ownerName} (${digits})`;
}

module.exports = {
  SLOTS,
  getSlotByDate,
  setSlotReservation,
  isSlotFreeOrMine,
  describeSlot,
};
