# Needlepoint Canvas Creator

A comprehensive web application that converts any image into beautiful needlepoint patterns using all 490 DMC thread colors. Create, organize, and track your needlepoint projects with ease.

## Features

###  Image Conversion
- **All Image Formats**: Support for PNG, JPG, JPEG, GIF, BMP, TIFF, WEBP, ICO, PPM, PGM, PBM, PNM
- **DMC Color Matching**: Uses all 490 DMC thread colors for accurate color reproduction
- **Custom Canvas Sizes**: Choose from preset sizes or create custom dimensions
- **Mesh Count Options**: 10, 12, 13, 14, 18 mesh or custom mesh count
- **Color Reduction**: Limit colors for simpler patterns or use all available colors

###  Gallery Management
- **User Accounts**: Secure email/password authentication
- **Pattern Organization**: Create folders to organize your patterns
- **Progress Tracking**: Mark completed stitches with interactive checkboxes
- **Zoom & Navigate**: Zoom in and out of patterns for detailed work

###  Supply Management
- **Thread Tracking**: Save links to your DMC thread purchases
- **Canvas & Tools**: Organize your needlepoint supplies
- **Shareable Wishlists**: Create and share wishlists with friends and family
- **Supply Links**: Save direct links to your favorite needlepoint stores

###  Modern Interface
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Drag & Drop Upload**: Easy file upload with drag and drop support
- **Real-time Preview**: See your pattern before saving
- **Beautiful UI**: Modern, intuitive interface with smooth animations

## Usage

### Creating Your First Pattern

1. **Upload an Image**
   - Click "Create Pattern" from the home page
   - Drag and drop your image or click to select
   - Supported formats: PNG, JPG, JPEG, GIF, BMP, TIFF, WEBP, ICO, PPM, PGM, PBM, PNM

2. **Configure Settings**
   - **Mesh Count**: Choose stitches per inch (10, 12, 13, 14, 18, or custom)
   - **Canvas Size**: Select preset sizes or enter custom dimensions
   - **Max Colors**: Limit colors for simpler patterns or use all available

3. **Generate Pattern**
   - Click "Create Pattern" to process your image
   - View the preview with color swatches and pattern information
   - Download the pattern or save to your gallery

### Managing Your Gallery

1. **Create an Account**
   - Register with your email and password
   - Login to access your personal gallery

2. **Organize Patterns**
   - Create folders to organize your patterns
   - Add patterns to specific folders
   - View all your patterns in one place

3. **Track Progress**
   - Click on any pattern to open the detailed view
   - Zoom in and out for detailed work
   - Click on stitches to mark them as completed
   - Progress is automatically saved

### Supply Management

1. **Add Supplies**
   - Save links to your DMC thread purchases
   - Add canvas, needles, and other tools
   - Include notes for each supply item

2. **Create Wishlists**
   - Build wishlists of patterns and supplies
   - Generate shareable URLs for friends and family
   - Share your wishlist with anyone

## Technical Details

### Backend (Python Flask)
- **Framework**: Flask with SQLAlchemy ORM
- **Database**: SQLite (can be easily changed to PostgreSQL/MySQL)
- **Image Processing**: PIL (Pillow) with NumPy
- **Authentication**: Flask-Login with password hashing
- **File Upload**: Secure file handling with size limits

### Frontend (HTML/CSS/JavaScript)
- **Design**: Modern, responsive CSS with Flexbox and Grid
- **Icons**: Font Awesome for beautiful icons
- **Interactions**: Vanilla JavaScript with modern ES6+ features
- **Animations**: Smooth CSS transitions and animations

### Image Processing
- **Color Matching**: Euclidean distance algorithm for DMC color matching
- **Resizing**: High-quality LANCZOS resampling
- **Grid Generation**: Automatic grid overlay with customizable line weights
- **Symbol Mapping**: Automatic symbol assignment for pattern charts

## File Structure

```
needlepoint-app/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── utils/
│   │   └── dmc_colors.py     # DMC color database
│   └── uploads/               # Uploaded images (created automatically)
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css     # Main stylesheet
│   │   └── js/
│   │       ├── main.js       # Index page JavaScript
│   │       ├── upload.js     # Upload page JavaScript
│   │       └── auth.js       # Authentication JavaScript
│   └── templates/
│       ├── index.html        # Home page
│       ├── upload.html       # Pattern creation page
│       ├── login.html        # Login page
│       └── register.html     # Registration page
└── README.md                 # This file
```

## Configuration

### Environment Variables
Create a `.env` file in the backend directory:
```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///needlepoint.db
MAX_FILE_SIZE=33554432
```

### Customization
- **DMC Colors**: Edit `backend/utils/dmc_colors.py` to add or modify colors
- **Grid Settings**: Modify constants in `backend/app.py` for grid appearance
- **File Limits**: Adjust `MAX_CONTENT_LENGTH` in the Flask app
- **Styling**: Customize colors and layout in `frontend/static/css/style.css`

## Troubleshooting

### Common Issues

1. **"Module not found" errors**
   - Ensure all dependencies are installed: `pip install -r requirements.txt`

2. **Image upload fails**
   - Check file size (max 32MB)
   - Verify file format is supported
   - Ensure uploads directory has write permissions

3. **Database errors**
   - Delete `needlepoint.db` and restart the application
   - Check database file permissions

4. **Port already in use**
   - Change port in `app.py`: `app.run(port=5001)`
   - Or kill the process using port 5000

### Performance Tips

- **Large Images**: Use "Fit to image" option for very large images
- **Color Reduction**: Limit colors for faster processing
- **Browser**: Use modern browsers for best performance

## License

This project is under an CC BY-NC-ND License


Transform your favorite images into beautiful needlepoint patterns with the power of all 490 DMC thread colors.
