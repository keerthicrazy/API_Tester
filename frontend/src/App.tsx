import {Toaster} from "@/components/ui/toaster";
import {Toaster as Sonner} from "@/components/ui/sonner";
import {TooltipProvider} from "@/components/ui/tooltip";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import QATools from "./components/QATools";
import Index from "./pages/Index";
import QuickTesting from "./pages/QuickTesting";
import CollectionTesting from "./pages/CollectionTesting";
import BDDTest from "./pages/BDDTest";
import { ReleaseNotes } from "./components/ReleaseNotes";
import NotFound from "./pages/NotFound";
import { isFeatureEnabled } from "@/config";

const App = () => {
  // Check if QA Tools Dashboard is enabled
  const showDashboard = isFeatureEnabled('qaToolsDashboard');
  
  // Check if Release Notes is enabled
  const showReleaseNotes = isFeatureEnabled('releaseNotes');
  
  return (
    <TooltipProvider>
        <Toaster/>
        <Sonner/>
        <BrowserRouter>
            <Routes>
                {/* Main route - conditional based on feature flag */}
                <Route path="/" element={showDashboard ? <QATools/> : <Index/>}/>
                
                {/* API Tester Pro routes - always available */}
                <Route path="/apitesterpro" element={<Index/>}/>
                <Route path="/apitesterpro/quick-testing" element={<QuickTesting/>}/>
                <Route path="/apitesterpro/collection" element={<CollectionTesting/>}/>
                <Route path="/apitesterpro/bdd-test" element={<BDDTest/>}/>
                
                {/* Release Notes route - conditional based on feature flag */}
                {showReleaseNotes && (
                  <Route path="/release-notes" element={<ReleaseNotes/>}/>
                )}
                
                {/* Legacy routes for backward compatibility */}
                <Route path="/quick-testing" element={<QuickTesting/>}/>
                <Route path="/collection" element={<CollectionTesting/>}/>
                <Route path="/bdd-test" element={<BDDTest/>}/>
                
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound/>}/>
            </Routes>
        </BrowserRouter>
    </TooltipProvider>
);
};

export default App;
