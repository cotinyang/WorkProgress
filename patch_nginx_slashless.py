import sys

nginx_conf_path = '/etc/nginx/sites-available/innosilo.conf'
output_path = '/home/cotin/WorkProgress/innosilo.conf.patched'

try:
    with open(nginx_conf_path, 'r', encoding='utf-8') as f:
        content = f.read()
except Exception as e:
    print(f"Error reading {nginx_conf_path}: {e}")
    sys.exit(1)

old_block = """    location /progress/ {
        alias /var/www/work-progress/;
        index index.html;
        try_files $uri $uri/ /progress/index.html;
    }"""

new_block = """    location = /progress {
        alias /var/www/work-progress/index.html;
        default_type text/html;
    }

    location /progress/ {
        alias /var/www/work-progress/;
        index index.html;
        try_files $uri $uri/ /progress/index.html;
    }"""

if old_block not in content:
    print("Error: Could not find the existing /progress/ location block in the config.")
    sys.exit(1)

patched_content = content.replace(old_block, new_block)

try:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(patched_content)
    print("Successfully generated patched config at:", output_path)
except Exception as e:
    print(f"Error writing {output_path}: {e}")
    sys.exit(1)
