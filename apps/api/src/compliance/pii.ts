const emailPattern = /([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const phonePattern = /\b(\+?\d{1,3})?[-.\s]?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})\b/g;

export const anonymizePii = (input: string) => {
  return input.replace(emailPattern, "[EMAIL_REDACTED]").replace(phonePattern, "[PHONE_REDACTED]");
};
