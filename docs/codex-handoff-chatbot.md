- QA hardening and governance closure
    
    TASK ID: AN-50
    TITLE: Add analytics QA coverage, privacy checks, and governance closure
    
    Read source-of-truth docs first. This ticket is about validation, not new feature scope.
    
    Goal:
    Make the analytics/admin portal delivery governance-complete.
    
    Implement/verify:
    
    1. API tests for:
        - admin login success/failure
        - unauthorized analytics access blocked
        - overview/timeseries/breakdowns contracts
        - invalid filter/date input handling
    2. Integration tests for:
        - route success/fail/start create analytics entries
        - story/chat interactions counted without storing content
        - analytics failure does not block primary flow
    3. UI tests for:
        - admin login
        - dashboard happy path
        - empty state
        - error state
    4. Privacy/security verification:
        - prove no chat content is persisted in analytics tables
        - prove no sensitive payloads are logged
    5. Governance updates:
        - update traceability matrix statuses
        - add test case IDs
        - ensure PR template boxes can be checked cleanly
    
    If any requirement lacks test coverage, mark it clearly and do not fake closure.
    
    Output:
    
    - tests added
    - FR/NFR to test mappings
    - any remaining blocked items
    - final traceability status updates
