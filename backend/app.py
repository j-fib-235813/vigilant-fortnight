from flask import Flask, render_template, request, jsonify, send_file, session, redirect, url_for, flash
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import uuid
import json
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import numpy as np
from utils.dmc_colors import find_closest_dmc_color, get_all_dmc_colors

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///needlepoint.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

# Supported image formats
ALLOWED_EXTENSIONS = {
    'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff', 'tif', 
    'webp', 'ico', 'ppm', 'pgm', 'pbm', 'pnm'
}

# Configuration constants
DEFAULT_CELL_PX = 28
HEAVY_GRID_EVERY = 10
MEDIUM_GRID_EVERY = 5
LEGEND_WIDTH_PX = 520
SYMBOLS = list("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()[]{}<>?/+=~:;,.")

# Database Models
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    patterns = db.relationship('Pattern', backref='user', lazy=True)
    folders = db.relationship('Folder', backref='user', lazy=True)
    supplies = db.relationship('Supply', backref='user', lazy=True)

class Pattern(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    folder_id = db.Column(db.Integer, db.ForeignKey('folder.id'), nullable=True)
    name = db.Column(db.String(200), nullable=False)
    original_image = db.Column(db.String(500), nullable=False)
    pattern_data = db.Column(db.Text, nullable=False)  # JSON string
    canvas_size = db.Column(db.String(50), nullable=False)
    mesh_count = db.Column(db.Integer, nullable=False)
    colors_used = db.Column(db.Text, nullable=False)  # JSON string
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    progress_data = db.Column(db.Text, nullable=True)  # JSON string for progress tracking

class Folder(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    patterns = db.relationship('Pattern', backref='folder', lazy=True)

class Supply(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # thread, canvas, needle, etc.
    link = db.Column(db.String(500), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Wishlist(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(200), nullable=False)
    items = db.Column(db.Text, nullable=False)  # JSON string
    shareable_url = db.Column(db.String(200), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def resize_to_stitches(img, stitches_w, stitches_h):
    """Resize image to stitch grid using LANCZOS"""
    rgb = img.convert("RGB")
    return rgb.resize((stitches_w, stitches_h), Image.Resampling.LANCZOS)

def nearest_color_indices(image_rgb, palette_rgb):
    """Find nearest DMC color for each pixel"""
    H, W, _ = image_rgb.shape
    img = image_rgb.reshape(-1, 3).astype(np.int16)
    
    N = palette_rgb.shape[0]
    chunk = 50000
    best_idx = np.zeros(img.shape[0], dtype=np.int32)
    best_dist = np.full(img.shape[0], 1e12, dtype=np.int64)
    
    for start in range(0, img.shape[0], chunk):
        end = min(start + chunk, img.shape[0])
        block = img[start:end]
        diff = block[:, None, :] - palette_rgb[None, :, :]
        dist2 = (diff * diff).sum(axis=2)
        idx = dist2.argmin(axis=1)
        val = dist2.min(axis=1)
        sel = val < best_dist[start:end]
        best_idx[start:end][sel] = idx[sel]
        best_dist[start:end][sel] = val[sel]
    
    return best_idx.reshape(H, W)

def reduce_to_top_colors(idx_map, max_colors):
    """Reduce to top N colors by frequency"""
    if max_colors <= 0:
        return idx_map
    
    flat = idx_map.reshape(-1)
    unique, counts = np.unique(flat, return_counts=True)
    order = np.argsort(-counts)
    keep = set(unique[order[:min(max_colors, len(unique))]])
    
    if len(keep) == len(unique):
        return idx_map
    
    kept_sorted = np.array(sorted(list(keep)))
    map_lut = {}
    for u in unique:
        if u in keep:
            map_lut[u] = u
        else:
            j = np.abs(kept_sorted - u).argmin()
            map_lut[u] = int(kept_sorted[j])
    
    remapped = np.vectorize(lambda z: map_lut[z], otypes=[np.int32])(idx_map)
    return remapped

def build_symbol_map(used_palette_indices):
    """Create symbol mapping for colors"""
    if len(used_palette_indices) > len(SYMBOLS):
        raise RuntimeError("Not enough symbols for the number of colors used. Reduce max colors.")
    mapping = {}
    for i, idx in enumerate(used_palette_indices):
        mapping[idx] = SYMBOLS[i]
    return mapping

def draw_grid(draw, W, H, cell):
    """Draw grid lines on the pattern"""
    for x in range(W + 1):
        xpx = x * cell
        width = 1
        if x % HEAVY_GRID_EVERY == 0:
            width = 3
        elif x % MEDIUM_GRID_EVERY == 0:
            width = 2
        draw.line([(xpx, 0), (xpx, H * cell)], fill=(0, 0, 0), width=width)
    
    for y in range(H + 1):
        ypx = y * cell
        width = 1
        if y % HEAVY_GRID_EVERY == 0:
            width = 3
        elif y % MEDIUM_GRID_EVERY == 0:
            width = 2
        draw.line([(0, ypx), (W * cell, ypx)], fill=(0, 0, 0), width=width)

def luminance(rgb):
    """Calculate luminance for text color choice"""
    r, g, b = rgb
    return 0.2126*r + 0.7152*g + 0.0722*b

def symbol_text_color(bg):
    """Choose text color based on background luminance"""
    return (0, 0, 0) if luminance(bg) > 140 else (255, 255, 255)

def render_colored_chart(idx_map, palette_idx, cell_px):
    """Render colored pattern chart"""
    H, W = idx_map.shape
    out = Image.new("RGB", (W*cell_px, H*cell_px), (255, 255, 255))
    draw = ImageDraw.Draw(out)
    
    for y in range(H):
        for x in range(W):
            idx = int(idx_map[y, x])
            _, _, color = palette_idx[idx]
            x0 = x*cell_px
            y0 = y*cell_px
            draw.rectangle([x0, y0, x0+cell_px, y0+cell_px], fill=color)
    
    draw_grid(draw, W, H, cell_px)
    return out

def render_symbol_chart(idx_map, palette_idx, cell_px, symbol_map):
    """Render symbol pattern chart with legend"""
    H, W = idx_map.shape
    chart_w = W*cell_px
    chart_h = H*cell_px
    out = Image.new("RGB", (chart_w + LEGEND_WIDTH_PX, chart_h), (255, 255, 255))
    draw = ImageDraw.Draw(out)

    try:
        font = ImageFont.truetype("DejaVuSansMono.ttf", int(cell_px*0.6))
    except Exception:
        font = ImageFont.load_default()

    # Draw cells and symbols
    for y in range(H):
        for x in range(W):
            idx = int(idx_map[y, x])
            _, _, color = palette_idx[idx]
            x0 = x*cell_px
            y0 = y*cell_px
            draw.rectangle([x0, y0, x0+cell_px, y0+cell_px], fill=(255, 255, 255))
            s = symbol_map[idx]
            tw, th = draw.textsize(s, font=font)
            tx = x0 + (cell_px - tw)//2
            ty = y0 + (cell_px - th)//2
            draw.text((tx, ty), s, fill=(0, 0, 0), font=font)

    draw_grid(draw, W, H, cell_px)

    # Legend
    flat = idx_map.reshape(-1)
    unique, counts = np.unique(flat, return_counts=True)
    usage = dict(zip([int(u) for u in unique], [int(c) for c in counts]))
    used = sorted(unique.tolist(), key=lambda u: (-usage[int(u)], u))
    
    lx = chart_w + 20
    ly = 20
    draw.text((lx, ly), "DMC Key", fill=(0, 0, 0), font=font)
    ly += 28
    draw.text((lx, ly), f"Total colors: {len(used)}", fill=(0, 0, 0), font=font)
    ly += 24
    draw.line([(chart_w, 0), (chart_w, chart_h)], fill=(0, 0, 0), width=2)

    for idx in used:
        idx = int(idx)
        dmc, name, rgb = palette_idx[idx]
        s = symbol_map[idx]
        swatch_x = lx
        swatch_y = ly + 4
        draw.rectangle([swatch_x, swatch_y, swatch_x+24, swatch_y+16], fill=rgb, outline=(0, 0, 0))
        
        try:
            small_font = ImageFont.truetype("DejaVuSansMono.ttf", 12)
        except Exception:
            small_font = ImageFont.load_default()
        draw.text((swatch_x+6, swatch_y-2), s, fill=symbol_text_color(rgb), font=small_font)

        text = f"{dmc}  {name}  (stitches: {usage[idx]})"
        draw.text((lx+32, ly), text, fill=(0, 0, 0), font=font)
        ly += 24
        if ly > chart_h - 28:
            lx += 240
            ly = 20

    return out

def create_needlepoint_pattern(image_path, canvas_size, mesh_count, max_colors=30):
    """Convert image to needlepoint pattern with enhanced processing"""
    try:
        # Open image
        img = Image.open(image_path)
        
        # Parse canvas size
        width, height = canvas_size.split('x')
        width, height = int(width), int(height)
        
        # Resize image to fit canvas
        img = resize_to_stitches(img, width, height)
        
        # Convert to numpy array
        img_array = np.array(img, dtype=np.uint8)
        
        # Get DMC palette
        dmc_colors = get_all_dmc_colors()
        palette_rgb = np.array([color[2] for color in dmc_colors], dtype=np.int16)
        palette_idx = {i: (color[0], color[1], color[2]) for i, color in enumerate(dmc_colors)}
        
        # Map to nearest DMC colors
        idx_map = nearest_color_indices(img_array, palette_rgb)
        
        # Reduce to top N colors if requested
        if max_colors > 0:
            idx_map = reduce_to_top_colors(idx_map, max_colors)
        
        # Get used colors and create symbol map
        flat = idx_map.reshape(-1)
        used = sorted(np.unique(flat).tolist())
        symbol_map = build_symbol_map(used)
        
        # Create pattern data
        pattern = []
        colors_used = []
        
        for y in range(height):
            row = []
            for x in range(width):
                idx = int(idx_map[y, x])
                dmc_num, dmc_name, rgb = palette_idx[idx]
                row.append({
                    'dmc': dmc_num,
                    'name': dmc_name,
                    'rgb': rgb,
                    'symbol': symbol_map[idx]
                })
                if dmc_num not in colors_used:
                    colors_used.append(dmc_num)
            pattern.append(row)
        
        return {
            'pattern': pattern,
            'colors_used': colors_used,
            'symbol_map': symbol_map,
            'width': width,
            'height': height,
            'mesh_count': mesh_count
        }
        
    except Exception as e:
        print(f"Error creating pattern: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        user = User(
            email=email,
            password_hash=generate_password_hash(password)
        )
        db.session.add(user)
        db.session.commit()
        
        login_user(user)
        return jsonify({'success': True, 'redirect': url_for('gallery')})
    
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password_hash, password):
            login_user(user)
            return jsonify({'success': True, 'redirect': url_for('gallery')})
        else:
            return jsonify({'error': 'Invalid email or password'}), 401
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))

@app.route('/upload', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'error': 'No image selected'}), 400
        
        if file and allowed_file(file.filename):
            # Save original image
            filename = secure_filename(file.filename)
            unique_filename = f"{uuid.uuid4()}_{filename}"
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
            file.save(filepath)
            
            # Get parameters
            canvas_size = request.form.get('canvas_size', '100x100')
            mesh_count = int(request.form.get('mesh_count', 14))
            max_colors = int(request.form.get('max_colors', 30))
            
            # Create pattern
            pattern_data = create_needlepoint_pattern(filepath, canvas_size, mesh_count, max_colors)
            
            if pattern_data:
                return jsonify({
                    'success': True,
                    'pattern_data': pattern_data,
                    'original_image': unique_filename,
                    'canvas_size': canvas_size,
                    'mesh_count': mesh_count,
                    'max_colors': max_colors
                })
            else:
                return jsonify({'error': 'Failed to create pattern'}), 500
        
        return jsonify({'error': 'Invalid file type'}), 400
    
    return render_template('upload.html')

@app.route('/save_pattern', methods=['POST'])
@login_required
def save_pattern():
    data = request.get_json()
    
    pattern = Pattern(
        user_id=current_user.id,
        name=data['name'],
        original_image=data['original_image'],
        pattern_data=json.dumps(data['pattern_data']),
        canvas_size=data['canvas_size'],
        mesh_count=data['mesh_count'],
        colors_used=json.dumps(data['colors_used'])
    )
    
    db.session.add(pattern)
    db.session.commit()
    
    return jsonify({'success': True, 'pattern_id': pattern.id})

@app.route('/gallery')
@login_required
def gallery():
    patterns = Pattern.query.filter_by(user_id=current_user.id).all()
    folders = Folder.query.filter_by(user_id=current_user.id).all()
    return render_template('gallery.html', patterns=patterns, folders=folders)

@app.route('/pattern/<int:pattern_id>')
@login_required
def view_pattern(pattern_id):
    pattern = Pattern.query.get_or_404(pattern_id)
    if pattern.user_id != current_user.id:
        return redirect(url_for('gallery'))
    
    pattern_data = json.loads(pattern.pattern_data)
    colors_used = json.loads(pattern.colors_used)
    progress_data = json.loads(pattern.progress_data) if pattern.progress_data else []
    
    return render_template('pattern_view.html', 
                         pattern=pattern, 
                         pattern_data=pattern_data,
                         colors_used=colors_used,
                         progress_data=progress_data)

@app.route('/update_progress', methods=['POST'])
@login_required
def update_progress():
    data = request.get_json()
    pattern_id = data['pattern_id']
    progress_data = data['progress_data']
    
    pattern = Pattern.query.get_or_404(pattern_id)
    if pattern.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    pattern.progress_data = json.dumps(progress_data)
    db.session.commit()
    
    return jsonify({'success': True})

@app.route('/create_folder', methods=['POST'])
@login_required
def create_folder():
    data = request.get_json()
    name = data['name']
    
    folder = Folder(user_id=current_user.id, name=name)
    db.session.add(folder)
    db.session.commit()
    
    return jsonify({'success': True, 'folder_id': folder.id})

@app.route('/add_supply', methods=['POST'])
@login_required
def add_supply():
    data = request.get_json()
    
    supply = Supply(
        user_id=current_user.id,
        name=data['name'],
        type=data['type'],
        link=data.get('link', ''),
        notes=data.get('notes', '')
    )
    
    db.session.add(supply)
    db.session.commit()
    
    return jsonify({'success': True, 'supply_id': supply.id})

@app.route('/create_wishlist', methods=['POST'])
@login_required
def create_wishlist():
    data = request.get_json()
    
    shareable_url = f"wishlist_{uuid.uuid4().hex[:8]}"
    
    wishlist = Wishlist(
        user_id=current_user.id,
        name=data['name'],
        items=json.dumps(data['items']),
        shareable_url=shareable_url
    )
    
    db.session.add(wishlist)
    db.session.commit()
    
    return jsonify({'success': True, 'shareable_url': shareable_url})

@app.route('/wishlist/<shareable_url>')
def view_wishlist(shareable_url):
    wishlist = Wishlist.query.filter_by(shareable_url=shareable_url).first_or_404()
    items = json.loads(wishlist.items)
    return render_template('wishlist_view.html', wishlist=wishlist, items=items)

@app.route('/dmc_colors')
def get_dmc_colors():
    colors = get_all_dmc_colors()
    return jsonify(colors)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5001)
