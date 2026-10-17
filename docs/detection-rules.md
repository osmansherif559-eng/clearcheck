# Detection rules 1.0.0

Each finding is evidence-linked and maps to a safe action. Rules are intentionally conservative: a generic word such as “urgent”, “bank”, or “verify” is not sufficient by itself.

| Rule ID | Trigger | Severity | User action |
| --- | --- | --- | --- |
| `message.urgency-threat` | Urgency combined with a request or account consequence | Medium/high | Pause and verify independently |
| `message.credential-request` | Password, OTP, recovery, or verification-code language combined with a request | High | Never share the code or password |
| `message.payment-pressure` | Payment language plus pressure, risky payment method, or upfront fee | High | Verify the request before sending money |
| `message.impersonation` | Known service/authority name combined with sensitive instructions | Medium | Use a trusted channel, not the message |
| `message.channel-change` | New number, private channel, or payment destination change plus a sensitive request | Medium | Confirm the new details separately |
| `url.invalid` | Standard URL parser cannot parse the input | Medium | Do not open; obtain the complete address |
| `url.unsupported-scheme` | Non-HTTP(S) URL scheme | High | Use the official app or site independently |
| `url.embedded-credentials` | Userinfo before the URL host | High | Do not open or copy credentials |
| `url.ip-host` | IPv4/IPv6 host instead of a domain | High | Navigate to the organization independently |
| `url.punycode` | Encoded internationalized hostname | Medium | Treat lookalike risk cautiously |
| `url.unusual-port` | Port other than 80 or 443 | Medium | Verify before entering sensitive information |
| `url.deep-subdomain` | Five or more hostname labels | Medium | Read the owner domain from right to left |
| `url.lookalike-brand` | Known brand word on an unfamiliar domain | Medium | Type the known service address yourself |
| `url.shortener` | Known URL-shortening host | Medium/unknown | Do not follow an unexpected shortened link |

## Known blind spots

The rules do not prove sender identity, detect all languages or obfuscations, understand every negation or quoted-message context, or establish domain ownership. A legitimate message can contain urgency or a link and still be classified as no major indicators when no sensitive combination is present.
