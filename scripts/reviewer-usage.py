#!/usr/bin/env python3
"""Report token metadata only; calculated costs are not posted billing charges."""
from decimal import Decimal
import json
from pathlib import Path

PRIVATE = Path(__file__).resolve().parents[1] / '.private/hosted-reviewer'
RATES = {'input': Decimal('0.10'), 'cached': Decimal('0.01'),
         'cache_write': Decimal('0.125'), 'output': Decimal('0.50')}
SOURCE = 'https://developers.openai.com/api/docs/models/gpt-6-luna'


def calculate(usage):
    incoming, outgoing = usage['input_tokens'], usage['output_tokens']
    detail = usage.get('input_tokens_details') or {}
    cached = detail.get('cached_tokens', 0)
    writes = detail.get('cache_write_tokens', 0)
    if any(type(n) is not int or n < 0 for n in [incoming, outgoing, cached, writes]):
        raise ValueError('Unexpected token metadata')
    if cached + writes > incoming:
        raise ValueError('Inconsistent token metadata')
    return ((incoming - cached - writes) * RATES['input'] + cached * RATES['cached']
            + writes * RATES['cache_write'] + outgoing * RATES['output']) / Decimal(1000000)


def main():
    rows = []
    for path in sorted([*PRIVATE.glob('api-check-*.json'), *PRIVATE.glob('pilot-usage-*.json')]):
        record = json.loads(path.read_text())
        row = {key: record.get(key) for key in ['kind', 'model', 'status', 'usage', 'candidate_messages', 'threads']}
        row['calculated_usd'] = str(calculate(row['usage'])) if row['model'] == 'gpt-6-luna' and row['usage'] else None
        rows.append(row)
    total = sum((Decimal(r['calculated_usd']) for r in rows if r['calculated_usd'] is not None), Decimal(0))
    print(json.dumps({'requests_with_usage': rows, 'calculated_total_usd': str(total),
                      'pricing_source': SOURCE, 'pricing_checked_new_york_date': '2026-11-20',
                      'posted_billing_verified': False,
                      'note': 'Connectivity tests and abbreviated pilots are separate from complete routine reviews. No monthly projection established.'}, indent=2))


if __name__ == '__main__':
    main()
