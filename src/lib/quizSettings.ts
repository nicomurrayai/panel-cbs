export function quizSettingsFromConfig(value: unknown) {
  const config = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  return {
    time_limit_seconds: typeof config.time_limit_seconds === "number" && Number.isInteger(config.time_limit_seconds) && config.time_limit_seconds >= 10 && config.time_limit_seconds <= 600 ? config.time_limit_seconds : 60,
    show_correct_answer: typeof config.show_correct_answer === "boolean" ? config.show_correct_answer : true,
  };
}
