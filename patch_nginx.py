import sys

nginx_conf_path = '/etc/nginx/sites-available/innosilo.conf'
output_path = '/home/cotin/WorkProgress/innosilo.conf.patched'

try:
    with open(nginx_conf_path, 'r', encoding='utf-8') as f:
        content = f.read()
except Exception as e:
    print(f"Error reading {nginx_conf_path}: {e}")
    sys.exit(1)

# Find the last closing brace '}' which closes the 443 server block
last_brace_index = content.rfind('}')
if last_brace_index == -1:
    print("Error: Could not find closing brace '}' in Nginx config.")
    sys.exit(1)

insert_text = """
    location /progress/ {
        alias /var/www/work-progress/;
        index index.html;
        try_files $uri $uri/ /progress/index.html;
    }
"""

patched_content = content[:last_brace_index] + insert_text + content[last_brace_index:]

try:
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(patched_content)
    print("Successfully generated patched config at:", output_path)
except Exception as e:
    print(f"Error writing {output_path}: {e}")
    sys.exit(1)
