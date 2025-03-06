import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const TaskForm = () => {
  const { projectId, taskId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: projectId,
    assigneeId: '',
    dueDate: null,
    priority: 'Medium',
    estimatedHours: '',
  })
  const [projectMembers, setProjectMembers] = useState([])

  useEffect(() => {
    if (taskId) {
      fetchTask()
    }
    fetchProjectMembers()
  }, [taskId, projectId])

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/tasks/${taskId}`)
      const task = response.data
      setFormData({
        title: task.title,
        description: task.description,
        projectId: task.project._id,
        assigneeId: task.assignee._id,
        dueDate: new Date(task.dueDate),
        priority: task.priority,
        estimatedHours: task.estimatedHours,
      })
    } catch (err) {
      setError('Failed to fetch task details')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectMembers = async () => {
    try {
      console.log('Fetching project members for project:', projectId);
      const response = await axios.get(`/api/projects/${projectId}`);
      console.log('Project data received:', response.data);
      
      // Include the project owner in the members list
      const members = [
        {
          user: response.data.owner,
          role: 'Manager'
        },
        ...response.data.members
      ];
      
      console.log('Processed members list:', members);
      setProjectMembers(members);
    } catch (err) {
      console.error('Failed to fetch project members:', err);
      setError('Failed to load project members');
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      dueDate: date,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      if (taskId) {
        await axios.put(`/api/tasks/${taskId}`, formData)
      } else {
        await axios.post('/api/tasks', formData)
      }
      navigate(`/projects/${projectId}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="md">
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          {taskId ? 'Edit Task' : 'Create New Task'}
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Task Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                multiline
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Assignee</InputLabel>
                <Select
                  name="assigneeId"
                  value={formData.assigneeId}
                  onChange={handleInputChange}
                  label="Assignee"
                >
                  {projectMembers.map((member) => (
                    <MenuItem 
                      key={member.user._id} 
                      value={member.user._id}
                    >
                      {member.user.name} ({member.role})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  label="Priority"
                >
                  <MenuItem value="Low">Low</MenuItem>
                  <MenuItem value="Medium">Medium</MenuItem>
                  <MenuItem value="High">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={formData.dueDate}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Estimated Hours"
                name="estimatedHours"
                type="number"
                value={formData.estimatedHours}
                onChange={handleInputChange}
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/projects/${projectId}`)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : taskId ? 'Update Task' : 'Create Task'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

export default TaskForm 