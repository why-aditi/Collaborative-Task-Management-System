import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  AvatarGroup,
  Tooltip,
  List,
  ListItem,
} from '@mui/material'
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Add as AddIcon,
  Person as PersonIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import ProjectMembers from '../components/ProjectMembers'
import TaskBoard from '../components/TaskBoard'
import ProjectSummaryReport from '../components/ProjectSummaryReport'

const ProjectDetail = () => {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [openReportDialog, setOpenReportDialog] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  })

  const fetchProject = useCallback(async () => {
    try {
      console.log('Fetching project with ID:', projectId);
      console.log('Current user:', user);
      console.log('Auth token:', localStorage.getItem('token'));
      
      const response = await axios.get(`/api/projects/${projectId}`);
      console.log('Project data received:', response.data);
      setProject(response.data);
    } catch (err) {
      console.error('Error fetching project:', err.response?.data || err.message);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      
      if (err.response?.status === 403) {
        setError('You do not have permission to view this project');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch project details');
      }
    } finally {
      setLoading(false);
    }
  }, [projectId, user]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const handleOpenDialog = () => {
    setFormData({
      name: project.name,
      description: project.description,
      startDate: project.startDate,
      endDate: project.endDate,
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
      await axios.put(`/api/projects/${projectId}`, formData)
      fetchProject()
      handleCloseDialog()
    } catch (err) {
      setError('Failed to update project')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/projects/${projectId}`)
      navigate('/projects')
    } catch (err) {
      setError('Failed to delete project')
      console.error(err)
    }
  }

  const handleMembersUpdate = () => {
    fetchProject();
  };

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

  if (!project) {
    return (
      <Container>
        <Typography align="center">Project not found</Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {project.description}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip
                label={project.status}
                color={project.status === 'Active' ? 'success' : 'default'}
                size="small"
              />
              <Box display="flex" alignItems="center">
                <TaskIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">
                  {project.tasks.length} tasks
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<ReportIcon />}
              onClick={() => setOpenReportDialog(true)}
            >
              Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleOpenDialog}
            >
              Edit
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/projects/${projectId}/tasks/new`)}
            >
              New Task
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
      </Paper>

      <Grid container spacing={3}>
        {/* Project Timeline */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Project Timeline
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Start Date
              </Typography>
              <Typography variant="body1">
                {new Date(project.startDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                End Date
              </Typography>
              <Typography variant="body1">
                {new Date(project.endDate).toLocaleDateString()}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Team Members */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <ProjectMembers
              projectId={projectId}
              members={project?.members || []}
              onMembersUpdate={handleMembersUpdate}
            />
          </Paper>
        </Grid>

        {/* Task Board */}
        <Grid item xs={12}>
          <TaskBoard projectId={projectId} />
        </Grid>
      </Grid>

      {/* Project Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Project</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Project Name"
              type="text"
              fullWidth
              required
              value={formData.name}
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
              name="startDate"
              label="Start Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.startDate}
              onChange={handleInputChange}
            />
            <TextField
              margin="dense"
              name="endDate"
              label="End Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formData.endDate}
              onChange={handleInputChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Project Summary Report Dialog */}
      <ProjectSummaryReport
        projectId={projectId}
        open={openReportDialog}
        onClose={() => setOpenReportDialog(false)}
      />
    </Container>
  )
}

export default ProjectDetail 