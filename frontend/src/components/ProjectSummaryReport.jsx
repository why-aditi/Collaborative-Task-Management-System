import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  GetApp as DownloadIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import axios from 'axios';

const ProjectSummaryReport = ({ projectId, open, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (open) {
      fetchReportData();
    }
  }, [open, projectId]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [projectResponse, tasksResponse, statsResponse] = await Promise.all([
        axios.get(`/api/projects/${projectId}`),
        axios.get(`/api/tasks/project/${projectId}`),
        axios.get(`/api/tasks/project/${projectId}/stats`),
      ]);

      setReportData({
        project: projectResponse.data,
        tasks: tasksResponse.data,
        stats: statsResponse.data,
      });
    } catch (err) {
      setError('Failed to fetch report data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const response = await axios.post(
        `/api/projects/${projectId}/report`,
        null,
        { 
          responseType: 'blob',
          headers: {
            'Accept': 'application/pdf',
          }
        }
      );

      // Check if the response is actually a PDF
      if (response.data.type !== 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const errorData = JSON.parse(reader.result);
            setError(errorData.message || 'Failed to generate PDF report');
          } catch {
            setError('Failed to generate PDF report - unexpected response format');
          }
        };
        reader.readAsText(response.data);
        return;
      }

      // Create blob from response data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `project-report-${projectId}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      console.error('Error generating PDF:', err);
      if (err.response) {
        setError(`Failed to generate PDF report: ${err.response.data.message || 'Server error'}`);
      } else if (err.request) {
        setError('Failed to generate PDF report: Network error');
      } else {
        setError(`Failed to generate PDF report: ${err.message}`);
      }
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Project Summary Report</DialogTitle>
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : reportData ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              {reportData.project.name}
            </Typography>
            <Typography color="textSecondary" paragraph>
              {reportData.project.description}
            </Typography>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Task Statistics
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Tasks</TableCell>
                    <TableCell align="right">{reportData.stats.totalTasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Completed Tasks</TableCell>
                    <TableCell align="right">{reportData.stats.completedTasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>In Progress</TableCell>
                    <TableCell align="right">{reportData.stats.inProgressTasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>To-Do</TableCell>
                    <TableCell align="right">{reportData.stats.todoTasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Overdue Tasks</TableCell>
                    <TableCell align="right">{reportData.stats.overdueTasks}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Priority Distribution
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Count</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>High Priority</TableCell>
                    <TableCell align="right">{reportData.stats.highPriorityTasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Medium Priority</TableCell>
                    <TableCell align="right">{reportData.stats.mediumPriorityTasks}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Low Priority</TableCell>
                    <TableCell align="right">{reportData.stats.lowPriorityTasks}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Time Tracking
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Metric</TableCell>
                    <TableCell align="right">Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Total Estimated Hours</TableCell>
                    <TableCell align="right">{reportData.stats.totalEstimatedHours}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Total Actual Hours</TableCell>
                    <TableCell align="right">{reportData.stats.totalActualHours}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button
          startIcon={<DownloadIcon />}
          variant="contained"
          onClick={generatePDF}
          disabled={loading || !reportData}
        >
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProjectSummaryReport; 