# Gateway Request Tracing

The mock gateway can attach request and trace identifiers to local runtime activity.

Trace records include method, path, status code, provider/model metadata, stream flag, success flag, usage and cost summaries, and event IDs.

Trace records do not include prompt bodies, completion text, authorization headers, cookies, bearer tokens, full request bodies, query values, or local machine paths.

Unfinished traces remain bounded by collector limits and can be inspected through programmatic APIs or the optional local traces endpoint.
