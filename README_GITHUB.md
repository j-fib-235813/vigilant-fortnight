# SAB Needlepoint Creator 🧵

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Flask](https://img.shields.io/badge/Flask-2.3+-green.svg)](https://flask.palletsprojects.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen.svg)](https://github.com/yourusername/sab-needlepoint)

A comprehensive web application that converts any image into beautiful needlepoint patterns using all 490 DMC thread colors. Create, organize, and track your needlepoint projects with ease.

## ✨ Features

### 🎨 Image Processing
- **All Image Formats**: PNG, JPG, JPEG, GIF, BMP, TIFF, WEBP, ICO, PPM, PGM, PBM, PNM
- **DMC Color Matching**: All 490 DMC thread colors with accurate color reproduction
- **Custom Canvas Sizes**: Preset sizes or custom dimensions
- **Mesh Count Options**: 10, 12, 13, 14, 18 mesh or custom
- **Color Reduction**: Limit colors for simpler patterns

### 📁 Project Management
- **User Authentication**: Secure email/password login
- **Pattern Organization**: Create folders to organize your patterns
- **Progress Tracking**: Interactive stitch marking
- **Zoom & Navigate**: Detailed pattern viewing

### 🛍️ Supply Management
- **Thread Tracking**: Save DMC thread purchase links
- **Canvas & Tools**: Organize needlepoint supplies
- **Shareable Wishlists**: Create and share wishlists
- **Supply Links**: Direct links to favorite stores

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sab-needlepoint.git
   cd sab-needlepoint
   ```

2. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python app.py
   ```

4. **Access the application**
   Open your browser and navigate to: `http://localhost:5001`

## 📸 Screenshots

### Home Page
![Home Page](docs/screenshots/home.png)

### Pattern Creation
![Pattern Creation](docs/screenshots/upload.png)

### Gallery View
![Gallery](docs/screenshots/gallery.png)

### Pattern Viewer
![Pattern Viewer](docs/screenshots/pattern-view.png)

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask 3.1+
- **Database**: SQLite (easily upgradable to PostgreSQL/MySQL)
- **Image Processing**: PIL (Pillow) with NumPy
- **Authentication**: Flask-Login with bcrypt
- **File Upload**: Secure handling with size limits

### Frontend
- **Design**: Modern CSS3 with Flexbox and Grid
- **Icons**: Font Awesome
- **Interactions**: Vanilla JavaScript (ES6+)
- **Animations**: Smooth CSS transitions

### Image Processing
- **Color Matching**: Euclidean distance algorithm
- **Resizing**: High-quality LANCZOS resampling
- **Grid Generation**: Automatic overlay with customizable weights
- **Symbol Mapping**: Automatic symbol assignment

## 📁 Project Structure

```
sab-needlepoint/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── utils/
│   │   └── dmc_colors.py     # DMC color database
│   └── uploads/               # Uploaded images (auto-created)
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css     # Main stylesheet
│   │   └── js/
│   │       ├── main.js       # Index page functionality
│   │       ├── upload.js     # Upload and pattern creation
│   │       └── auth.js       # Authentication handling
│   └── templates/
│       ├── index.html        # Landing page
│       ├── upload.html       # Pattern creation
│       ├── login.html        # User login
│       └── register.html     # User registration
├── docs/                     # Documentation and screenshots
├── start_app.sh             # Easy startup script
├── README.md                # Detailed documentation
└── .gitignore               # Git ignore rules
```

## 🎯 Usage Examples

### Creating Your First Pattern

1. **Upload an Image**
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

## 🔧 Configuration

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🐛 Troubleshooting

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
   - Or kill the process using the port

### Performance Tips

- **Large Images**: Use "Fit to image" option for very large images
- **Color Reduction**: Limit colors for faster processing
- **Browser**: Use modern browsers for best performance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- DMC Thread for the comprehensive color palette
- Flask community for the excellent web framework
- Font Awesome for the beautiful icons
- All contributors and users of this project

## 📞 Support

For questions or issues:
1. Check the troubleshooting section above
2. Review the code comments for technical details
3. Create an issue in the repository
4. Contact: your-email@example.com

---

**Happy Stitching! 🧵✨**

Transform your favorite images into beautiful needlepoint patterns with the power of all 490 DMC thread colors.

---

<div align="center">
  <sub>Built with ❤️ for the needlepoint community</sub>
</div>
