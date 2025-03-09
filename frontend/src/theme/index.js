import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#2196f3",
      light: "#64b5f6",
      dark: "#1976d2",
      contrastText: "#fff",
    },
    secondary: {
      main: "#ff4081",
      light: "#ff79b0",
      dark: "#c60055",
      contrastText: "#fff",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
    success: {
      main: "#4caf50",
      light: "#81c784",
      dark: "#388e3c",
    },
    error: {
      main: "#f44336",
      light: "#e57373",
      dark: "#d32f2f",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 500,
      marginBottom: "1rem",
      color: "#1a1a1a",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 500,
      marginBottom: "0.875rem",
      color: "#1a1a1a",
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 500,
      marginBottom: "0.75rem",
      color: "#1a1a1a",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
      color: "rgba(0, 0, 0, 0.87)",
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0,0,0,0.2)",
            transform: "translateY(-1px)",
          },
        },
        outlined: {
          "&:hover": {
            backgroundColor: "rgba(33, 150, 243, 0.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0px 4px 12px rgba(0,0,0,0.05)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            boxShadow: "0px 8px 16px rgba(0,0,0,0.1)",
            transform: "translateY(-4px)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            transition: "all 0.2s ease-in-out",
            "&:hover": {
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#2196f3",
              },
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "0px 1px 3px rgba(0,0,0,0.05)",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(0,0,0,0.12)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          transition: "background-color 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(33, 150, 243, 0.04)",
          },
        },
      },
    },
  },
});
