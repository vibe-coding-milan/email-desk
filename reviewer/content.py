"""Plain/HTML mail and Google Docs text extraction; never renders or fetches resources."""
import base64
import re
from html.parser import HTMLParser


def text_runs(value):
    if isinstance(value, dict):
        if 'textRun' in value:
            yield value['textRun'].get('content', '')
        else:
            for child in value.values():
                yield from text_runs(child)
    elif isinstance(value, list):
        for child in value:
            yield from text_runs(child)


class VisibleHTML(HTMLParser):
    """Extract visible text without rendering HTML or fetching any resource."""
    VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'}
    BLOCK = {'br', 'div', 'p', 'li', 'tr', 'td', 'th', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack, self.output = [], []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        style = re.sub(r'\s+', '', attrs.get('style', '').lower())
        hidden = (bool(self.stack and self.stack[-1][1])
                  or tag in {'head', 'script', 'style', 'template', 'noscript'}
                  or 'hidden' in attrs or attrs.get('aria-hidden', '').lower() == 'true'
                  or 'display:none' in style or 'visibility:hidden' in style)
        if tag not in self.VOID:
            self.stack.append((tag, hidden))
        if not hidden:
            if tag in self.BLOCK:
                self.output.append('\n')
            if tag == 'img' and attrs.get('alt'):
                self.output.append(attrs['alt'][:500] + ' ')

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, -1, -1):
            if self.stack[index][0] == tag:
                visible = not self.stack[index][1]
                del self.stack[index:]
                if visible and tag in self.BLOCK:
                    self.output.append('\n')
                break

    def handle_data(self, text):
        if not self.stack or not self.stack[-1][1]:
            self.output.append(text)


def decoded_body(payload):
    data = payload.get('body', {}).get('data', '')
    if not data:
        return ''
    raw = base64.urlsafe_b64decode(data + '=' * (-len(data) % 4))
    headers = {h['name'].lower(): h['value'] for h in payload.get('headers', [])}
    charset = re.search(r'charset\s*=\s*["\']?([^\s;"\']+)', headers.get('content-type', ''), re.I)
    try:
        return raw.decode(charset.group(1) if charset else 'utf-8', 'replace')
    except LookupError:
        return raw.decode('utf-8', 'replace')


def html_document(text):
    return bool(re.match(r'^\s*(?:<!doctype\s+html\b|<html\b)', text, re.I))


def body_text(payload):
    headers = {h['name'].lower(): h['value'] for h in payload.get('headers', [])}
    if payload.get('filename') or headers.get('content-disposition', '').lower().startswith('attachment'):
        return ''
    mime = payload.get('mimeType', '').lower()
    parts = payload.get('parts', [])
    if mime == 'multipart/alternative':
        # Some senders put a stale HTML template in the plain alternative.
        # Prefer the declared HTML body in that case instead of a bogus fallback.
        malformed_plain = any(p.get('mimeType', '').lower() == 'text/plain'
                              and html_document(decoded_body(p)) for p in parts if not p.get('filename'))
        if malformed_plain:
            for part in parts:
                if part.get('mimeType', '').lower() == 'text/html':
                    text = body_text(part)
                    if text.strip():
                        return text
        for preferred in ['text/plain', 'text/html']:
            for part in parts:
                if part.get('mimeType', '').lower() == preferred:
                    text = body_text(part)
                    if text.strip():
                        return text
        return next((text for text in map(body_text, parts) if text.strip()), '')
    if mime in {'text/plain', 'text/html'}:
        text = decoded_body(payload)
        if text:
            if mime == 'text/html' or html_document(text):
                parser = VisibleHTML()
                parser.feed(text)
                parser.close()
                text = ''.join(parser.output)
            return '\n'.join(line for line in (re.sub(r'\s+', ' ', line).strip() for line in text.splitlines()) if line)
    return '\n'.join(filter(None, (body_text(p) for p in parts)))
