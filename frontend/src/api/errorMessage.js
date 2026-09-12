export function getErrorMessage(error, fallback = '요청을 처리하지 못했습니다. 다시 시도해주세요.') {
  const message = error.response?.data?.message;
  if (typeof message === 'string' && message.trim()) return message;
  if (!error.response) return '서버 응답을 확인하지 못했습니다. 저장 요청이었다면 목록을 새로고침해 반영 여부를 먼저 확인해주세요.';
  return fallback;
}
