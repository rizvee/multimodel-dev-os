# Gateway Cost Estimation

Sprint G adds static cost-estimation hooks for local accounting.

Cost estimates use supplied or static registry metadata only. They never perform live pricing lookups, currency conversion, spending decisions, or billing API calls.

Unknown pricing or unknown usage returns `null`, not zero. Currency mismatch produces a warning. All values are estimates, not billing records.
