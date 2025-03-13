import React, { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  Grid,
  Card,
  CardContent,
} from '@mui/material'
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Work as WorkIcon,
  CalendarToday as CalendarIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Group as GroupIcon,
} from '@mui/icons-material'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    activeProjects: 0,
  })

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      const response = await axios.get('/api/users/stats')
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch user stats:', err)
    }
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
          <Box display="flex" alignItems="center" gap={3}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
              }}
            >
              <PersonIcon sx={{ fontSize: 60 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" gutterBottom>
                {user.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {user.role}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* User Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <EmailIcon color="primary" />
                      <Typography variant="body1">
                        {user.email}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <WorkIcon color="primary" />
                      <Typography variant="body1">
                        {user.role}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CalendarIcon color="primary" />
                      <Typography variant="body1">
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Activity Statistics */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Activity Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <AssignmentIcon color="primary" />
                      <Box>
                        <Typography variant="h6">
                          {stats.totalTasks}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Total Tasks
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircleIcon color="success" />
                      <Box>
                        <Typography variant="h6">
                          {stats.completedTasks}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed Tasks
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={1}>
                      <GroupIcon color="primary" />
                      <Box>
                        <Typography variant="h6">
                          {stats.activeProjects}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Active Projects
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}

export default Profile 