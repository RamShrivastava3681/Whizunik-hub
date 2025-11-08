# 📁 Local Document Storage
# This directory stores uploaded documents from applications
# Files are organized by application ID and document type

# Directory Structure:
# uploads/
#   ├── applicationId1/
#   │   ├── company-documents/
#   │   ├── financial-documents/
#   │   └── trade-documents/
#   ├── applicationId2/
#   └── ...

# Security Note:
# - This directory should be outside the web root in production
# - Consider implementing virus scanning for uploaded files
# - Set appropriate file permissions

# File Types Supported:
# - PDF (.pdf)
# - Word Documents (.doc, .docx)
# - Excel Spreadsheets (.xls, .xlsx)
# - Images (.jpg, .jpeg, .png)

# Maximum file size: 10MB per file
# Configured in .env: MAX_FILE_SIZE=10485760
