# Gateway Usage Accounting

Sprint G records normalized usage metadata for the mock gateway runtime.

Tracked fields include input tokens, output tokens, total tokens, cached input tokens, reasoning tokens, provider-reported vs estimated state, tokenizer label, and provider/model/request/trace identifiers.

Mock provider usage is deterministic and provider-reported by the mock runtime. Token estimation hooks are available for future routing and diagnostics, but they do not add tokenizer dependencies and do not claim provider-tokenizer accuracy.

Prompts and completions are not retained in usage records.
