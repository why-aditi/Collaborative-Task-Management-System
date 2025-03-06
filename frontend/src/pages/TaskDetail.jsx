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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as SelectMenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextareaAutosize,
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
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const TaskDetail = () => {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [task, setTask] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'Medium',
    status: '',
  })
  const [newComment, setNewComment] = useState('')
  const [comments, setComments] = useState([])

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
    } catch (err) {
      console.error('Failed to fetch project details:', err)
    }
  }, [projectId])

  useEffect(() => {
    fetchTaskDetails()
    fetchProjectDetails()
  }, [fetchTaskDetails, fetchProjectDetails])

  const handleOpenDialog = () => {
    setFormData({
      title: task.title,
      description: task.description,
      assignee: task.assignee._id,
      dueDate: new Date(task.dueDate).toISOString().split('T')[0],
      priority: task.priority,
      status: task.status,
    })
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.patch(`/api/tasks/${taskId}`, formData)
      fetchTaskDetails()
      handleCloseDialog()
    } catch (err) {
      setError('Failed to update task')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/tasks/${taskId}`)
      navigate(`/projects/${projectId}/tasks`)
    } catch (err) {
      setError('Failed to delete task')
      console.error(err)
    }
  }

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.patch(`/api/tasks/${taskId}/status`, { status: newStatus })
      fetchTaskDetails()
    } catch (err) {
      setError('Failed to update task status')
      console.error(err)
    }
  }

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
  }

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
        <Typography>Loading task details...</Typography>
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
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenDialog}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
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
            Actions
          </Typography>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={() => handleStatusChange('To-Do')}
              disabled={task.status === 'To-Do'}
            >
              Move to To-Do
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleStatusChange('In Progress')}
              disabled={task.status === 'In Progress'}
            >
              Move to In Progress
            </Button>
            <Button
              variant="outlined"
              onClick={() => handleStatusChange('Completed')}
              disabled={task.status === 'Completed'}
            >
              Mark as Completed
            </Button>
            <Button
              variant="outlined"
              startIcon={<AttachFileIcon />}
            >
              Add Attachment
            </Button>
          </Box>
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
      </Paper>

      {/* Edit Task Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Task</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="title"
              label="Title"
              type="text"
              fullWidth
              required
              value={formData.title}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              type="text"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="assignee"
              label="Assignee"
              type="text"
              fullWidth
              required
              value={formData.assignee}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="dueDate"
              label="Due Date"
              type="date"
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              value={formData.dueDate}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                label="Priority"
              >
                <SelectMenuItem value="Low">Low</SelectMenuItem>
                <SelectMenuItem value="Medium">Medium</SelectMenuItem>
                <SelectMenuItem value="High">High</SelectMenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="Status"
              >
                <SelectMenuItem value="To-Do">To-Do</SelectMenuItem>
                <SelectMenuItem value="In Progress">In Progress</SelectMenuItem>
                <SelectMenuItem value="Completed">Completed</SelectMenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  )
}

export default TaskDetail 