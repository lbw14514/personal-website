from flask import Flask, request, jsonify, send_file
from mcstatus import JavaServer
import requests
import geoip2.database
import os
import time
import hashlib

app = Flask(__name__)

try:
    reader = geoip2.database.Reader('GeoLite2-City.mmdb')
except:
    reader = None

DOWNLOAD_DIR = os.path.join(os.path.dirname(__file__), 'downloads')

def get_geo_from_apis(ip):
    apis = [
        {
            'url': f'https://ipapi.co/{ip}/json/',
            'parser': lambda d: {
                'city': d.get('city', ''),
                'region': d.get('region', ''),
                'country': d.get('country_name', ''),
                'lat': d.get('latitude'),
                'lon': d.get('longitude')
            } if d and not d.get('error') else None
        },
        {
            'url': f'http://ip-api.com/json/{ip}?fields=city,regionName,country,lat,lon',
            'parser': lambda d: {
                'city': d.get('city', ''),
                'region': d.get('regionName', ''),
                'country': d.get('country', ''),
                'lat': d.get('lat'),
                'lon': d.get('lon')
            } if d and d.get('status') != 'fail' else None
        },
        {
            'url': f'https://ipinfo.io/{ip}/json',
            'parser': lambda d: {
                'city': d.get('city', ''),
                'region': d.get('region', ''),
                'country': d.get('country', ''),
                'lat': float(d['loc'].split(',')[0]) if d.get('loc') else None,
                'lon': float(d['loc'].split(',')[1]) if d.get('loc') else None
            } if d and 'error' not in d else None
        },
        {
            'url': f'https://freegeoip.app/json/{ip}',
            'parser': lambda d: {
                'city': d.get('city', ''),
                'region': d.get('region_name', ''),
                'country': d.get('country_name', ''),
                'lat': d.get('latitude'),
                'lon': d.get('longitude')
            } if d else None
        },
        {
            'url': f'https://ipwhois.app/json/{ip}',
            'parser': lambda d: {
                'city': d.get('city', ''),
                'region': d.get('region', ''),
                'country': d.get('country', ''),
                'lat': d.get('latitude'),
                'lon': d.get('longitude')
            } if d and d.get('success', True) else None
        }
    ]
    for api in apis:
        try:
            resp = requests.get(api['url'], timeout=3)
            if resp.status_code == 200:
                data = resp.json()
                parsed = api['parser'](data)
                if parsed:
                    return parsed
        except:
            continue
    return None

def get_file_list():
    files = []
    if os.path.exists(DOWNLOAD_DIR):
        for f in os.listdir(DOWNLOAD_DIR):
            path = os.path.join(DOWNLOAD_DIR, f)
            if os.path.isfile(path):
                size = os.path.getsize(path)
                mtime = os.path.getmtime(path)
                files.append({
                    'name': f,
                    'size': size,
                    'date': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
                })
    files.sort(key=lambda x: x['date'], reverse=True)
    return files

@app.route('/api/mc-status')
def mc_status():
    host = request.args.get('host', '127.0.0.1')
    port = request.args.get('port', '25565')
    try:
        server = JavaServer.lookup(f"{host}:{port}")
        status = server.status()
        return jsonify({
            "online": True,
            "players": {"online": status.players.online, "max": status.players.max},
            "version": status.version.name,
            "motd": str(status.description)
        })
    except Exception as e:
        return jsonify({"online": False, "error": str(e)})

@app.route('/api/ip-info')
def ip_info():
    ip = request.headers.get('X-Real-IP') or request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or request.remote_addr
    location = {}
    need_external = True

    if reader:
        try:
            resp = reader.city(ip)
            city = resp.city.name or ''
            region = resp.subdivisions.most_specific.name or ''
            country = resp.country.name or ''
            lat = resp.location.latitude
            lon = resp.location.longitude
            if city:
                location = {
                    "city": city,
                    "region": region,
                    "country": country,
                    "latitude": lat,
                    "longitude": lon
                }
                need_external = False
        except:
            pass

    if need_external:
        geo_data = get_geo_from_apis(ip)
        if geo_data:
            location = {
                "city": geo_data.get('city', ''),
                "region": geo_data.get('region', ''),
                "country": geo_data.get('country', ''),
                "latitude": geo_data.get('lat'),
                "longitude": geo_data.get('lon')
            }

    return jsonify({"ip": ip, "location": location})

@app.route('/api/downloads')
def api_downloads():
    return jsonify(get_file_list())

@app.route('/api/download/<filename>')
def download_file(filename):
    if not filename:
        return "File not specified", 400
    safe_path = os.path.normpath(os.path.join(DOWNLOAD_DIR, filename))
    if not safe_path.startswith(os.path.normpath(DOWNLOAD_DIR)):
        return "Forbidden", 403
    if not os.path.isfile(safe_path):
        return "File not found", 404

    sha = hashlib.sha256()
    with open(safe_path, 'rb') as fh:
        for chunk in iter(lambda: fh.read(8192), b''):
            sha.update(chunk)
    response = send_file(safe_path, as_attachment=True)
    response.headers['X-File-Sha256'] = sha.hexdigest()
    return response

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=False)