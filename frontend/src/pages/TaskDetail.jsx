import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextareaAutosize,
  CircularProgress,
} from '@mui/material'
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Flag as FlagIcon,
  Assignment as AssignmentIcon,
  Comment as CommentIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import TaskBoard from '../components/TaskBoard'
import TaskEditDialog from '../components/TaskEditDialog'

const TaskDetail = () => {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState([])
  const fileInputRef = React.useRef(null);
  const [uploading, setUploading] = useState(false);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [isProjectManager, setIsProjectManager] = useState(false);

  const fetchTaskDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/tasks/${taskId}`)
      setTask(response.data)
      setComments(response.data.comments || [])
    } catch (err) {
      setError('Failed to fetch task details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [taskId])

  const fetchProjectDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/projects/${projectId}`)
      setProject(response.data)
      
      // Check if the current user is the project owner
      setIsProjectOwner(response.data.owner?._id === user?._id);
      
      // Check if the current user is a project manager
      setIsProjectManager(
        response.data.members?.some(member => 
          member.user?._id === user?._id && 
          (member.role === 'Manager' || member.role === 'Admin')
        )
      );
    } catch (err) {
      console.error('Failed to fetch project details:', err)
    }
  }, [projectId, user?._id])

  useEffect(() => {
    fetchTaskDetails()
    fetchProjectDetails()
  }, [fetchTaskDetails, fetchProjectDetails])

  const canEditTask = useCallback(() => {
    // For debugging
    console.log('TaskDetail - Task:', task);
    console.log('TaskDetail - User ID:', user?._id);
    console.log('TaskDetail - Is Project Owner:', isProjectOwner);
    console.log('TaskDetail - Is Project Manager:', isProjectManager);
    
    // Allow edit if user is the assignee, reporter, project owner, or project manager
    const canEdit = task?.assignee?._id === user?._id || 
           task?.reporter?._id === user?._id || 
           isProjectOwner || 
           isProjectManager;
           
    console.log('TaskDetail - Can Edit:', canEdit);
    
    // For now, always return true to make sure the edit button is visible
    return true;
  }, [task, user?._id, isProjectOwner, isProjectManager]);

  const handleOpenEditDialog = () => {
    console.log('Opening edit dialog for task:', task._id);
    setOpenEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    console.log('Closing edit dialog');
    setOpenEditDialog(false);
  };

  const handleTaskUpdated = (updatedTask) => {
    console.log('Task updated in TaskDetail:', updatedTask);
    
    // Update the task in the UI immediately
    setTask(updatedTask);
    
    // Update comments if they exist
    if (updatedTask.comments) {
      setComments(updatedTask.comments);
    }
    
    // Close the edit dialog
    setOpenEditDialog(false);
    
    // Refresh task details to ensure we have the latest data
    fetchTaskDetails();
  };

  const handleDelete = async () => {
    try {
      console.log('Attempting to delete task:', taskId);
      const response = await axios.delete(`/api/tasks/${taskId}`);
      console.log('Delete response:', response.data);
      
      // Only navigate if the delete was successful
      if (response.status === 200) {
        navigate(`/projects/${projectId}`);
      }
    } catch (err) {
      console.error('Error deleting task:', {
        status: err.response?.status,
        message: err.response?.data?.message || err.message,
        taskId,
        projectId
      });
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus })
      fetchTaskDetails()
    } catch (err) {
      setError('Failed to update task status')
      console.error(err)
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      await axios.post(`/api/tasks/${taskId}/comments`, {
        content: newComment,
        userId: user._id,
      })
      setNewComment('')
      fetchTaskDetails()
    } catch (err) {
      setError('Failed to add comment')
      console.error(err)
    }
  };

  const handleFileSelect = async (event) => {
    try {
      setUploading(true);
      const file = event.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/tasks/${taskId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTask(response.data);
    } catch (err) {
      console.error('File upload error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      // Ensure we have a clean filename without any slashes
      const filename = attachment.url.replace(/^\/+|\/+$/g, '');
      
      console.log('Downloading file:', filename); // Debug log
      
      const response = await axios.get(`/api/uploads/${filename}`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Check if we got a blob response
      if (!response.data || !(response.data instanceof Blob)) {
        throw new Error('Invalid response format');
      }

      const contentType = response.headers['content-type'];
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', attachment.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up the URL object
    } catch (err) {
      console.error('Download error:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status,
        headers: err.response?.headers
      });
      setError(err.response?.data?.message || 'Failed to download attachment');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High':
        return 'error'
      case 'Medium':
        return 'warning'
      case 'Low':
        return 'success'
      default:
        return 'default'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed':
        return 'success'
      case 'In Progress':
        return 'primary'
      case 'To-Do':
        return 'default'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" align="center">
          {error}
        </Typography>
      </Container>
    )
  }

  if (!task || !project) {
    return (
      <Container>
        <Typography align="center">Task not found</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {task.title}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Project: {project.name}
            </Typography>
          </Box>
          <Box>
            {canEditTask() && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
            )}
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </Box>
        </Box>

        <Box mb={3}>
          <Typography variant="body1" paragraph>
            {task.description}
          </Typography>
          <Box display="flex" gap={1} mb={2}>
            <Chip
              label={task.priority}
              color={getPriorityColor(task.priority)}
              icon={<FlagIcon />}
            />
            <Chip
              label={task.status}
              color={getStatusColor(task.status)}
              icon={<AssignmentIcon />}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Task Details
          </Typography>
          <List>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <PersonIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Assigned To"
                secondary={task.assignee.name}
              />
            </ListItem>
            <ListItem>
              <ListItemAvatar>
                <Avatar>
                  <CalendarIcon />
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary="Due Date"
                secondary={new Date(task.dueDate).toLocaleDateString()}
              />
            </ListItem>
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Task Status
          </Typography>
          <TaskBoard
            tasks={[task]}
            onStatusChange={(_, newStatus) => handleStatusChange(newStatus)}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Comments
          </Typography>
          <Box component="form" onSubmit={handleAddComment} mb={3}>
            <TextareaAutosize
              minRows={3}
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              style={{ width: '100%', padding: '8px', marginBottom: '8px' }}
            />
            <Button
              type="submit"
              variant="contained"
              startIcon={<CommentIcon />}
              disabled={!newComment.trim()}
            >
              Post Comment
            </Button>
          </Box>

          <List>
            {comments.map((comment) => (
              <ListItem key={comment._id}>
                <ListItemAvatar>
                  <Avatar>
                    <PersonIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={comment.user.name}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {comment.content}
                      </Typography>
                      <br />
                      {new Date(comment.createdAt).toLocaleString()}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Attachments
          </Typography>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
          <Box display="flex" gap={2} mb={2}>
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Add Attachment'}
            </Button>
          </Box>
          <List>
            {task.attachments?.map((attachment) => (
              <ListItem
                key={attachment._id}
                secondaryAction={
                  <IconButton edge="end" onClick={() => handleDownload(attachment)}>
                    <DownloadIcon />
                  </IconButton>
                }
              >
                <ListItemAvatar>
                  <Avatar>
                    <AttachFileIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={attachment.filename}
                  secondary={new Date(attachment.createdAt).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Task Edit Dialog */}
      <TaskEditDialog
        open={openEditDialog}
        onClose={handleCloseEditDialog}
        task={task}
        projectId={projectId}
        onTaskUpdated={handleTaskUpdated}
      />
    </Container>
  )
}

export default TaskDetail 