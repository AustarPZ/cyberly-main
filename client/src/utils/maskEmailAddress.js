export function maskEmailAddress(email = "") {
  const value = String(email || "");
  const atIndex = value.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === value.length - 1) return "";

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex + 1);
  if (localPart.length === 1) return `*@${domain}`;
  if (localPart.length <= 4) {
    return `${localPart[0]}${"*".repeat(localPart.length - 1)}@${domain}`;
  }

  return `${localPart.slice(0, 4)}${"*".repeat(localPart.length - 4)}@${domain}`;
}
