import os
import zlib
import struct

os.makedirs('public', exist_ok=True)

def create_png(width, height, filename, is_maskable=False):
    # Generates a PNG with emerald theme (#059669 background, with darker/lighter SQL database graphic)
    raw_data = bytearray()
    
    # Background: Emerald #059669 = (5, 150, 105)
    bg_r, bg_g, bg_b = 5, 150, 105
    fg_r, fg_g, fg_b = 255, 255, 255
    accent_r, accent_g, accent_b = 251, 191, 36 # Amber yellow lightning/accent
    
    cx, cy = width / 2.0, height / 2.0
    scale = (width / 512.0)
    
    for y in range(height):
        raw_data.append(0) # filter type 0 (None)
        for x in range(width):
            # Check if inside database cylinder icon
            # Normalize to 512 coordinate space
            nx = (x - cx) / scale
            ny = (y - cy) / scale
            
            # Draw rounded background if not maskable
            dist_center = (nx*nx + ny*ny)**0.5
            
            # Icon bounds: 
            # Cylinder top: ellipse at ny = -70, rx = 120, ry = 40
            # Cylinder mid: ellipse at ny = 0, rx = 120, ry = 40
            # Cylinder bot: ellipse at ny = 70, rx = 120, ry = 40
            # Height between -70 and 70, x between -120 and 120
            
            in_icon = False
            is_accent = False
            
            # Check cylinder shape
            if -120 <= nx <= 120 and -70 <= ny <= 90:
                # Top ellipse
                top_eq = (nx / 110.0)**2 + ((ny + 50) / 35.0)**2
                bot_eq = (nx / 110.0)**2 + ((ny - 50) / 35.0)**2
                mid_eq = (nx / 110.0)**2 + ((ny + 0) / 35.0)**2
                
                # Cylinder body: between top and bottom
                if top_eq <= 1.0 or bot_eq <= 1.0 or (-50 <= ny <= 50 and abs(nx) <= 110):
                    # Rim or body
                    if top_eq <= 1.0:
                        in_icon = True
                    elif abs((nx / 110.0)**2 + ((ny - 50) / 35.0)**2 - 1.0) < 0.25:
                        in_icon = True
                    elif abs((nx / 110.0)**2 + ((ny + 0) / 35.0)**2 - 1.0) < 0.25:
                        in_icon = True
                    elif abs(nx) >= 95 and -50 <= ny <= 50:
                        in_icon = True

            # Quick lightning bolt across
            # polygon roughly (15,-60), (-25, 10), (5, 10), (-10, 70), (35, -5), (5, -5)
            if (-20 <= nx <= 30) and (-50 <= ny <= 60):
                # Simple lightning slice
                if (ny - nx * 1.5 < 10) and (ny - nx * 1.5 > -40):
                    is_accent = True
            
            if is_accent:
                raw_data.extend((accent_r, accent_g, accent_b, 255))
            elif in_icon:
                raw_data.extend((fg_r, fg_g, fg_b, 255))
            else:
                raw_data.extend((bg_r, bg_g, bg_b, 255))

    # Compress IDAT
    compressed = zlib.compress(bytes(raw_data), 9)
    
    # Write PNG
    with open(filename, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n') # Magic
        # IHDR
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
        f.write(struct.pack('>I', len(ihdr_data)))
        f.write(b'IHDR')
        f.write(ihdr_data)
        f.write(struct.pack('>I', zlib.crc32(b'IHDR' + ihdr_data)))
        
        # IDAT
        f.write(struct.pack('>I', len(compressed)))
        f.write(b'IDAT')
        f.write(compressed)
        f.write(struct.pack('>I', zlib.crc32(b'IDAT' + compressed)))
        
        # IEND
        f.write(struct.pack('>I', 0))
        f.write(b'IEND')
        f.write(struct.pack('>I', zlib.crc32(b'IEND')))

create_png(192, 192, 'public/pwa-192x192.png')
create_png(512, 512, 'public/pwa-512x512.png')
create_png(512, 512, 'public/pwa-maskable-512x512.png', is_maskable=True)
create_png(180, 180, 'public/apple-touch-icon.png')
print("PWA icons generated successfully!")
