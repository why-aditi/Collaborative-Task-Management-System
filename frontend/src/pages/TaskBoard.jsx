import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
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
} from '@mui/material'
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const TaskBoard = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    dueDate: '',
    priority: 'Medium',
  })

  useEffect(() => {
    fetchTasks()
  }, [projectId])

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`/api/tasks/project/${projectId}`)
      setTasks(response.data)
    } catch (err) {
      setError('Failed to fetch tasks')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (task = null) => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        assignee: task.assignee._id,
        dueDate: new Date(task.dueDate).toISOString().split('T')[0],
        priority: task.priority,
      })
      setSelectedTask(task)
    } else {
      setFormData({
        title: '',
        description: '',
        assignee: '',
        dueDate: '',
        priority: 'Medium',
      })
      setSelectedTask(null)
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedTask(null)
  }

  const handleMenuOpen = (event, task) => {
    setSelectedTask(task)
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
    setSelectedTask(null)
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
      if (selectedTask) {
        await axios.patch(`/api/tasks/${selectedTask._id}`, formData)
      } else {
        await axios.post('/api/tasks', {
          ...formData,
          projectId,
        })
      }
      fetchTasks()
      handleCloseDialog()
    } catch (err) {
      setError('Failed to save task')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/tasks/${selectedTask._id}`)
      fetchTasks()
      handleMenuClose()
    } catch (err) {
      setError('Failed to delete task')
      console.error(err)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await axios.patch(`/api/tasks/${taskId}`, { status: newStatus })
      fetchTasks()
    } catch (err) {
      setError('Failed to update task status')
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

  const columns = [
    { id: 'To-Do', title: 'To Do' },
    { id: 'In Progress', title: 'In Progress' },
    { id: 'Completed', title: 'Completed' },
  ]

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography>Loading tasks...</Typography>
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

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Task Board</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          New Task
        </Button>
      </Box>

      <Grid container spacing={2}>
        {columns.map((column) => (
          <Grid item xs={12} md={4} key={column.id}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                {column.title} ({tasks.filter((task) => task.status === column.id).length})
              </Typography>
              {tasks
                .filter((task) => task.status === column.id)
                .map((task) => (
                  <Card key={task._id} sx={{ mb: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Typography variant="h6" gutterBottom>
                          {task.title}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, task)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {task.description}
                      </Typography>
                      <Box display="flex" gap={1} mb={1}>
                        <Chip
                          label={task.priority}
                          color={getPriorityColor(task.priority)}
                          size="small"
                        />
                        <Chip
                          label={task.status}
                          color={getStatusColor(task.status)}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Assigned to: {task.assignee.name}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {columns.map((col) => (
                        <Button
                          key={col.id}
                          size="small"
                          onClick={() => handleStatusChange(task._id, col.id)}
                          disabled={task.status === col.id}
                        >
                          {col.title}
                        </Button>
                      ))}
                    </CardActions>
                  </Card>
                ))}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Task Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedTask ? 'Edit Task' : 'New Task'}</DialogTitle>
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
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              {selectedTask ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Task Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleOpenDialog(selectedTask)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Container>
  )
}

export default TaskBoard 