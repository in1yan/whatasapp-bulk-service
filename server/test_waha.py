import urllib.request

req = urllib.request.Request(
    'http://waha:3000/api/startTyping',
    headers={'X-Api-Key': '42acf499bce0482fa3e7b90068f71c45', 'Content-Type': 'application/json'},
    data=b'{"session":"default", "chatId":"12132132130@c.us"}'
)
try:
    print(urllib.request.urlopen(req).read())
except Exception as e:
    print('ERROR:', getattr(e, 'code', str(e)), getattr(e, 'read', lambda: b'')())
