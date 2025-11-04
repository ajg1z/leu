export function isNotEmptyString(value: string) {
  return value !== "";
}

export function isNotBlankOrEmptyString(value: string) {
  return  isNotEmptyString(value.trim());
}