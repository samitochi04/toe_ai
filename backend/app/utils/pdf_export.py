"""
PDF export utilities for TOE AI Backend
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
import os
import uuid
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)


class PDFExporter:
    """PDF export functionality for chats"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Setup custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='ChatUser',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leftIndent=20,
            textColor=colors.blue
        ))
        
        self.styles.add(ParagraphStyle(
            name='ChatAssistant',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leftIndent=20,
            textColor=colors.darkgreen
        ))
        
        self.styles.add(ParagraphStyle(
            name='ChatTimestamp',
            parent=self.styles['Normal'],
            fontSize=8,
            spaceAfter=3,
            textColor=colors.grey
        ))
    
    def export_normal_chat(self, chat_data: dict, user_data: dict, include_metadata: bool = True) -> str:
        """Export normal chat to PDF"""
        try:
            # Generate filename
            filename = f"normal_chat_{chat_data['id']}_{uuid.uuid4().hex[:8]}.pdf"
            filepath = os.path.join(settings.UPLOAD_DIR, "pdfs", filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(filepath, pagesize=A4)
            story = []
            
            # Title
            title = Paragraph(f"Chat: {chat_data['title']}", self.styles['Title'])
            story.append(title)
            story.append(Spacer(1, 12))
            
            # Metadata section
            if include_metadata:
                story.extend(self._add_metadata(chat_data, user_data, "Normal Chat"))
            
            # Conversation section
            story.append(Paragraph("Conversation", self.styles['Heading2']))
            story.append(Spacer(1, 12))
            
            # Add messages
            for message in chat_data.get('conversation', []):
                story.extend(self._add_message(message))
            
            # Build PDF
            doc.build(story)
            
            return filename
            
        except Exception as e:
            logger.error(f"Error exporting normal chat to PDF: {e}")
            raise
    
    def export_interview_chat(self, chat_data: dict, user_data: dict, include_metadata: bool = True, include_audio_links: bool = False) -> str:
        """Export interview chat to PDF"""
        try:
            # Generate filename
            filename = f"interview_chat_{chat_data['id']}_{uuid.uuid4().hex[:8]}.pdf"
            filepath = os.path.join(settings.UPLOAD_DIR, "pdfs", filename)
            
            # Create PDF document
            doc = SimpleDocTemplate(filepath, pagesize=A4)
            story = []
            
            # Title
            title = Paragraph(f"Interview: {chat_data['title']}", self.styles['Title'])
            story.append(title)
            story.append(Spacer(1, 12))
            
            # Interview details
            if chat_data.get('job_position') or chat_data.get('company_name'):
                details = []
                if chat_data.get('job_position'):
                    details.append(f"Position: {chat_data['job_position']}")
                if chat_data.get('company_name'):
                    details.append(f"Company: {chat_data['company_name']}")
                
                details_text = " | ".join(details)
                story.append(Paragraph(details_text, self.styles['Heading3']))
                story.append(Spacer(1, 12))
            
            # Metadata section
            if include_metadata:
                story.extend(self._add_metadata(chat_data, user_data, "Interview Chat"))
            
            # Interview settings
            if chat_data.get('interview_settings'):
                story.append(Paragraph("Interview Settings", self.styles['Heading2']))
                settings_data = chat_data['interview_settings']
                settings_table = [
                    ["Voice Type", settings_data.get('voice_type', 'N/A')],
                    ["Voice Speed", str(settings_data.get('voice_speed', 'N/A'))],
                    ["Language", settings_data.get('language', 'N/A')],
                    ["Difficulty", settings_data.get('difficulty', 'N/A')],
                    ["Interview Type", settings_data.get('interview_type', 'N/A')]
                ]
                
                table = Table(settings_table, colWidths=[2*inch, 3*inch])
                table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0, 0), (-1, 0), 10),
                    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                    ('GRID', (0, 0), (-1, -1), 1, colors.black)
                ]))
                
                story.append(table)
                story.append(Spacer(1, 12))
            
            # Conversation section
            story.append(Paragraph("Interview Conversation", self.styles['Heading2']))
            story.append(Spacer(1, 12))
            
            # Add messages
            for message in chat_data.get('conversation', []):
                story.extend(self._add_message(message, include_audio_links))
            
            # Build PDF
            doc.build(story)
            
            return filename
            
        except Exception as e:
            logger.error(f"Error exporting interview chat to PDF: {e}")
            raise
    
    def _add_metadata(self, chat_data: dict, user_data: dict, chat_type: str) -> list:
        """Add metadata section to PDF"""
        story = []
        
        story.append(Paragraph("Chat Information", self.styles['Heading2']))
        
        metadata_table = [
            ["Type", chat_type],
            ["Created by", f"{user_data['full_name']} ({user_data['alias']})"],
            ["Created on", self._format_datetime(chat_data['created_at'])],
            ["Last updated", self._format_datetime(chat_data['updated_at'])],
        ]
        
        if chat_data.get('duration_minutes'):
            metadata_table.append(["Duration", f"{chat_data['duration_minutes']} minutes"])
        
        table = Table(metadata_table, colWidths=[2*inch, 4*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        
        story.append(table)
        story.append(Spacer(1, 20))
        
        return story
    
    def _add_message(self, message: dict, include_audio_links: bool = False) -> list:
        """Add a chat message to PDF"""
        story = []
        
        # Timestamp
        timestamp = self._format_datetime(message.get('timestamp', ''))
        story.append(Paragraph(timestamp, self.styles['ChatTimestamp']))
        
        # Message content based on role
        role = message.get('role', '').upper()
        content = message.get('content', '')
        
        if role == 'USER':
            story.append(Paragraph(f"<b>You:</b> {content}", self.styles['ChatUser']))
        elif role == 'ASSISTANT':
            story.append(Paragraph(f"<b>AI:</b> {content}", self.styles['ChatAssistant']))
        else:
            story.append(Paragraph(f"<b>{role}:</b> {content}", self.styles['Normal']))
        
        # Audio link if available and requested
        if include_audio_links and message.get('audio_url'):
            audio_text = f"🔊 Audio: {message['audio_url']}"
            story.append(Paragraph(audio_text, self.styles['ChatTimestamp']))
        
        story.append(Spacer(1, 8))
        
        return story
    
    def _format_datetime(self, dt_string: str) -> str:
        """Format datetime string for display"""
        try:
            if not dt_string:
                return "N/A"
            
            # Parse ISO format datetime
            if 'T' in dt_string:
                dt = datetime.fromisoformat(dt_string.replace('Z', '+00:00'))
            else:
                dt = datetime.fromisoformat(dt_string)
            
            return dt.strftime("%B %d, %Y at %I:%M %p")
        except:
            return dt_string or "N/A"


def export_chat_to_pdf(chat_data: dict, user_data: dict, chat_type: str, include_metadata: bool = True, include_audio_links: bool = False) -> dict:
    """Export chat to PDF and return file info"""
    try:
        exporter = PDFExporter()
        
        if chat_type == "normal":
            filename = exporter.export_normal_chat(chat_data, user_data, include_metadata)
        elif chat_type == "interview":
            filename = exporter.export_interview_chat(chat_data, user_data, include_metadata, include_audio_links)
        else:
            raise ValueError(f"Unknown chat type: {chat_type}")
        
        # Get file info
        filepath = os.path.join(settings.UPLOAD_DIR, "pdfs", filename)
        file_size = os.path.getsize(filepath)
        
        # Generate URL and expiry
        # backend_url = os.getenv('BACKEND_URL', 'http://localhost:8000')
        pdf_url = f"/static/uploads/pdfs/{filename}"
        expires_at = datetime.utcnow().isoformat()  # Could add actual expiry logic
        
        return {
            "pdf_url": pdf_url,
            "filename": filename,
            "file_size_bytes": file_size,
            "expires_at": expires_at
        }
        
    except Exception as e:
        logger.error(f"Error exporting chat to PDF: {e}")
        raise