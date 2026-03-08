import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/ui/Sidebar";
import Breadcrumb from "../../components/ui/Breadcrumb";
import RoleBasedAccess from "../../components/ui/RoleBasedAccess";
import IntegrationStatus from "../../components/ui/IntegrationStatus";
import ClientCard from "./components/ClientCard";
import ClientProfile from "./components/ClientProfile";
import SearchFilters from "./components/SearchFilters";
import BulkActionsBar from "./components/BulkActionsBar";
import EmailComposer from "./components/EmailComposer";
import AddClientModal from "./components/AddClientModal";
import DeleteClientModal from "./components/DeleteClientModal";
import EditClientModal from "./components/EditClientModal";

import { clientService } from "../../services/clientService";
import { storageService } from "../../services/storageService";

import Button from "../../components/ui/Button";

const ClientManagementDashboard = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [selectedClient, setSelectedClient] = useState(null);
    const [selectedClients, setSelectedClients] = useState([]);
    const [showEmailComposer, setShowEmailComposer] = useState(false);
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [filteredClients, setFilteredClients] = useState([]);
    const [allClients, setAllClients] = useState([]);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [clientToDelete, setClientToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [clientToEdit, setClientToEdit] = useState(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setError(null);
            const clients = await clientService?.getAllClients();

            // Convert snake_case to camelCase and logo paths to signed URLs
            const clientsWithLogoUrls = await Promise.all(
                clients?.map(async (client) => {
                    const transformedClient = {
                        id: client?.id,
                        companyName: client?.company_name,
                        logo: client?.logo,
                        logoAlt: client?.logo_alt,
                        primaryContact: client?.primary_contact,
                        email: client?.email,
                        phone: client?.phone,
                        industry: client?.industry,
                        location: client?.location,
                        status: client?.status,
                        activeProposals: client?.proposal_count || 0,
                        wonProposals: client?.status_breakdown?.Won || 0,
                        totalValue: client?.total_value ? `$${(client?.total_value / 1000)?.toFixed(1)}K` : "$0",
                        clientSince: client?.client_since,
                        lastInteraction: client?.last_interaction || "N/A",
                        description: client?.description,
                        proposals: client?.proposals || [],
                        communications: client?.communications || [],
                        documents: client?.documents || [],
                        statusBreakdown: client?.status_breakdown || { Draft: 0, Approved: 0, Closed: 0, Won: 0 },
                    };

                    // Only convert logo path to signed URL if it exists and is not already a URL
                    if (transformedClient?.logo && !transformedClient?.logo?.startsWith("http")) {
                        try {
                            const logoUrl = await storageService?.getClientLogoUrl(transformedClient?.logo);
                            if (logoUrl) {
                                transformedClient.logo = logoUrl;
                            }
                        } catch (error) {
                            console.warn(`Failed to get logo URL for client ${client?.id}:`, error);
                            // Keep the original path or set to null
                            transformedClient.logo = null;
                        }
                    }

                    return transformedClient;
                }),
            );

            setAllClients(clientsWithLogoUrls);
            setFilteredClients(clientsWithLogoUrls);
        } catch (err) {
            console.error("Failed to load clients:", err);
            setError(err?.message || "Failed to load clients");
        }
    };

    const mockClients = [
        {
            id: 1,
            companyName: "TechVision Solutions",
            logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1fc28eaa7-1764648368637.png",
            logoAlt: "Modern tech company logo with blue gradient and geometric shapes on white background",
            primaryContact: "Sarah Mitchell",
            email: "sarah.mitchell@techvision.com",
            phone: "+1 (555) 123-4567",
            industry: "Technology",
            location: "San Francisco, CA",
            status: "Active",
            activeProposals: 3,
            wonProposals: 12,
            totalValue: "$2.4M",
            clientSince: "2023",
            lastInteraction: "2 hours ago",
            description:
                "TechVision Solutions is a leading provider of enterprise software solutions specializing in cloud infrastructure and digital transformation services. They serve Fortune 500 companies across North America with innovative technology platforms.",
            proposals: [
                {
                    id: 1,
                    title: "Cloud Migration Project",
                    description: "Complete infrastructure migration to AWS cloud platform",
                    value: "$450,000",
                    date: "Jan 15, 2026",
                    status: "Pending",
                },
                {
                    id: 2,
                    title: "Security Audit Services",
                    description: "Comprehensive security assessment and implementation",
                    value: "$180,000",
                    date: "Dec 20, 2025",
                    status: "Won",
                },
            ],

            communications: [
                {
                    id: 1,
                    type: "email",
                    subject: "Q1 2026 Planning Meeting",
                    preview: "Looking forward to discussing our strategic initiatives for the upcoming quarter...",
                    date: "2 hours ago",
                },
                {
                    id: 2,
                    type: "call",
                    subject: "Project Status Update",
                    preview: "Discussed current project milestones and upcoming deliverables...",
                    date: "Yesterday",
                },
            ],

            documents: [
                {
                    id: 1,
                    name: "Master Service Agreement.pdf",
                    size: "2.4 MB",
                    date: "Jan 20, 2026",
                },
                {
                    id: 2,
                    name: "Technical Specifications.docx",
                    size: "1.8 MB",
                    date: "Jan 18, 2026",
                },
            ],
        },
        {
            id: 2,
            companyName: "Global Finance Corp",
            logo: "https://img.rocket.new/generatedImages/rocket_gen_img_175c27d30-1767558611401.png",
            logoAlt:
                "Professional financial services logo with gold and navy blue colors featuring abstract building design",
            primaryContact: "Michael Chen",
            email: "m.chen@globalfinance.com",
            phone: "+1 (555) 234-5678",
            industry: "Finance",
            location: "New York, NY",
            status: "Active",
            activeProposals: 2,
            wonProposals: 8,
            totalValue: "$1.8M",
            clientSince: "2022",
            lastInteraction: "1 day ago",
            description:
                "Global Finance Corp is an international investment banking firm providing comprehensive financial services including wealth management, corporate advisory, and investment solutions to institutional and high-net-worth clients worldwide.",
            proposals: [
                {
                    id: 3,
                    title: "Risk Management Platform",
                    description: "Implementation of advanced risk analytics system",
                    value: "$320,000",
                    date: "Jan 10, 2026",
                    status: "Pending",
                },
            ],

            communications: [
                {
                    id: 3,
                    type: "email",
                    subject: "Quarterly Review Scheduled",
                    preview: "Confirming our meeting for next Tuesday to review Q4 performance...",
                    date: "1 day ago",
                },
            ],

            documents: [
                {
                    id: 3,
                    name: "Compliance Report 2025.pdf",
                    size: "3.2 MB",
                    date: "Jan 15, 2026",
                },
            ],
        },
        {
            id: 3,
            companyName: "HealthCare Innovations",
            logo: "https://img.rocket.new/generatedImages/rocket_gen_img_17e5785bf-1764669191217.png",
            logoAlt: "Healthcare company logo with medical cross symbol in teal and white color scheme",
            primaryContact: "Dr. Emily Rodriguez",
            email: "e.rodriguez@healthcareinnovations.com",
            phone: "+1 (555) 345-6789",
            industry: "Healthcare",
            location: "Boston, MA",
            status: "Pending",
            activeProposals: 1,
            wonProposals: 5,
            totalValue: "$980K",
            clientSince: "2024",
            lastInteraction: "3 days ago",
            description:
                "HealthCare Innovations develops cutting-edge medical technology solutions and patient management systems for hospitals and healthcare providers, focusing on improving patient outcomes through digital health innovations.",
            proposals: [
                {
                    id: 4,
                    title: "Patient Portal Development",
                    description: "Custom patient engagement platform with telemedicine capabilities",
                    value: "$275,000",
                    date: "Jan 5, 2026",
                    status: "Pending",
                },
            ],

            communications: [
                {
                    id: 4,
                    type: "email",
                    subject: "Technical Requirements Review",
                    preview: "Please find attached the updated technical specifications for review...",
                    date: "3 days ago",
                },
            ],

            documents: [
                {
                    id: 4,
                    name: "HIPAA Compliance Checklist.pdf",
                    size: "1.5 MB",
                    date: "Jan 12, 2026",
                },
            ],
        },
        {
            id: 4,
            companyName: "Manufacturing Pro Inc",
            logo: "https://img.rocket.new/generatedImages/rocket_gen_img_152ca943a-1768551527308.png",
            logoAlt: "Industrial manufacturing company logo with gear icon and orange accent colors on dark background",
            primaryContact: "James Wilson",
            email: "j.wilson@manufacturingpro.com",
            phone: "+1 (555) 456-7890",
            industry: "Manufacturing",
            location: "Detroit, MI",
            status: "Active",
            activeProposals: 4,
            wonProposals: 15,
            totalValue: "$3.2M",
            clientSince: "2021",
            lastInteraction: "5 hours ago",
            description:
                "Manufacturing Pro Inc is a leading industrial manufacturing company specializing in automotive components and advanced manufacturing solutions, serving major automotive manufacturers with precision engineering and quality assurance.",
            proposals: [
                {
                    id: 5,
                    title: "IoT Sensor Network",
                    description: "Smart factory implementation with real-time monitoring",
                    value: "$520,000",
                    date: "Jan 22, 2026",
                    status: "Won",
                },
            ],

            communications: [
                {
                    id: 5,
                    type: "call",
                    subject: "Production Line Integration",
                    preview: "Discussed timeline for sensor deployment across three facilities...",
                    date: "5 hours ago",
                },
            ],

            documents: [
                {
                    id: 5,
                    name: "Factory Floor Plans.pdf",
                    size: "4.8 MB",
                    date: "Jan 20, 2026",
                },
            ],
        },
        {
            id: 5,
            companyName: "Retail Dynamics Group",
            logo: "https://img.rocket.new/generatedImages/rocket_gen_img_1f3f23ea7-1766800845267.png",
            logoAlt: "Modern retail brand logo with shopping bag icon in vibrant purple and pink gradient",
            primaryContact: "Lisa Anderson",
            email: "l.anderson@retaildynamics.com",
            phone: "+1 (555) 567-8901",
            industry: "Retail",
            location: "Chicago, IL",
            status: "Active",
            activeProposals: 2,
            wonProposals: 10,
            totalValue: "$1.5M",
            clientSince: "2023",
            lastInteraction: "1 week ago",
            description:
                "Retail Dynamics Group operates a nationwide chain of specialty retail stores with focus on omnichannel customer experience, combining physical retail presence with advanced e-commerce platforms and customer loyalty programs.",
            proposals: [
                {
                    id: 6,
                    title: "E-commerce Platform Upgrade",
                    description: "Next-generation online shopping experience with AI recommendations",
                    value: "$380,000",
                    date: "Dec 28, 2025",
                    status: "Pending",
                },
            ],

            communications: [
                {
                    id: 6,
                    type: "email",
                    subject: "Holiday Season Performance",
                    preview: "Reviewing the successful implementation during peak shopping season...",
                    date: "1 week ago",
                },
            ],

            documents: [
                {
                    id: 6,
                    name: "Customer Analytics Report.xlsx",
                    size: "2.1 MB",
                    date: "Jan 8, 2026",
                },
            ],
        },
    ];

    const mockActivities = [
        {
            id: 1,
            type: "proposal",
            title: "New Proposal Submitted",
            description: "Cloud Migration Project proposal sent to TechVision Solutions for review",
            time: "2 hours ago",
            user: "John Smith",
        },
        {
            id: 2,
            type: "email",
            title: "Email Sent",
            description: "Follow-up email sent to Global Finance Corp regarding Risk Management Platform",
            time: "5 hours ago",
            user: "Sarah Johnson",
        },
        {
            id: 3,
            type: "meeting",
            title: "Meeting Scheduled",
            description: "Quarterly review meeting scheduled with Manufacturing Pro Inc for next Tuesday",
            time: "Yesterday",
            user: "Michael Brown",
        },
        {
            id: 4,
            type: "call",
            title: "Client Call",
            description: "Discussed technical requirements with HealthCare Innovations team",
            time: "2 days ago",
            user: "Emily Davis",
        },
        {
            id: 5,
            type: "document",
            title: "Document Uploaded",
            description: "Master Service Agreement uploaded for TechVision Solutions",
            time: "3 days ago",
            user: "David Wilson",
        },
        {
            id: 6,
            type: "proposal",
            title: "Proposal Won",
            description: "IoT Sensor Network proposal accepted by Manufacturing Pro Inc",
            time: "4 days ago",
            user: "Lisa Martinez",
        },
        {
            id: 7,
            type: "email",
            title: "Email Received",
            description: "Response received from Retail Dynamics Group on e-commerce platform requirements",
            time: "5 days ago",
            user: "System",
        },
        {
            id: 8,
            type: "meeting",
            title: "Meeting Completed",
            description: "Project kickoff meeting held with Global Finance Corp",
            time: "1 week ago",
            user: "Robert Taylor",
        },
    ];

    const handleSearch = (searchTerm) => {
        let filtered = allClients?.filter(
            (client) =>
                client?.companyName?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                client?.primaryContact?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                client?.industry?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
        );
        setFilteredClients(filtered);
    };

    const handleFilter = (filters) => {
        let filtered = allClients;

        if (filters?.industry) {
            filtered = filtered?.filter(
                (client) => client?.industry?.toLowerCase() === filters?.industry?.toLowerCase(),
            );
        }

        if (filters?.status) {
            filtered = filtered?.filter((client) => client?.status?.toLowerCase() === filters?.status?.toLowerCase());
        }

        setFilteredClients(filtered);
    };

    const handleClientSelect = (client) => {
        setSelectedClient(client);
    };

    const handleBulkAction = (action) => {
        console.log(`Bulk action: ${action} for ${selectedClients?.length} clients`);
    };

    const handleEmailClick = () => {
        setShowEmailComposer(true);
    };

    const handleCreateProposal = () => {
        navigate("/proposal-management-dashboard");
    };

    const handleEmailSend = (emailData) => {
        console.log("Email sent:", emailData);
    };

    const handleAddClient = async (newClientData) => {
        try {
            const createdClient = await clientService?.createClient(newClientData);
            await loadClients();
            setShowAddClientModal(false);
            if (createdClient) {
                setSelectedClient(createdClient);
            }
        } catch (err) {
            console.error("Failed to add client:", err);
            // Re-throw the error so the modal can handle it
            throw err;
        }
    };

    const handleDeleteClick = (client) => {
        setClientToDelete(client);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (!clientToDelete) return;

        try {
            setIsDeleting(true);
            await clientService?.deleteClient(clientToDelete?.id);

            // Remove from local state
            setAllClients((prev) => prev?.filter((c) => c?.id !== clientToDelete?.id));
            setFilteredClients((prev) => prev?.filter((c) => c?.id !== clientToDelete?.id));

            // Clear selection if deleted client was selected
            if (selectedClient?.id === clientToDelete?.id) {
                setSelectedClient(null);
            }

            // Close modal and reset state
            setShowDeleteModal(false);
            setClientToDelete(null);
        } catch (err) {
            console.error("Failed to delete client:", err);
            alert("Failed to delete client. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteModal(false);
        setClientToDelete(null);
    };

    const handleEditClick = (client) => {
        setClientToEdit(client);
        setShowEditModal(true);
    };

    const handleEditSave = async (updatedClientData) => {
        if (!clientToEdit) return;

        try {
            await clientService?.updateClient(clientToEdit?.id, updatedClientData);
            await loadClients();

            // Update selected client if it was the one being edited
            if (selectedClient?.id === clientToEdit?.id) {
                const updatedClient = await clientService?.getClientById(clientToEdit?.id);
                if (updatedClient) {
                    // Transform to camelCase
                    const transformedClient = {
                        id: updatedClient?.id,
                        companyName: updatedClient?.company_name,
                        logo: updatedClient?.logo,
                        logoAlt: updatedClient?.logo_alt,
                        primaryContact: updatedClient?.primary_contact,
                        email: updatedClient?.email,
                        phone: updatedClient?.phone,
                        industry: updatedClient?.industry,
                        location: updatedClient?.location,
                        status: updatedClient?.status,
                        activeProposals: updatedClient?.active_proposals || 0,
                        wonProposals: updatedClient?.won_proposals || 0,
                        totalValue: updatedClient?.total_value || "$0",
                        clientSince: updatedClient?.client_since,
                        lastInteraction: updatedClient?.last_interaction || "N/A",
                        description: updatedClient?.description,
                        proposals: updatedClient?.proposals || [],
                        communications: updatedClient?.communications || [],
                        documents: updatedClient?.documents || [],
                    };

                    if (transformedClient?.logo) {
                        const logoUrl = await storageService?.getClientLogoUrl(transformedClient?.logo);
                        transformedClient.logo = logoUrl || transformedClient?.logo;
                    }

                    setSelectedClient(transformedClient);
                }
            }

            setShowEditModal(false);
            setClientToEdit(null);
        } catch (err) {
            console.error("Failed to update client:", err);
            throw err;
        }
    };

    const handleEditCancel = () => {
        setShowEditModal(false);
        setClientToEdit(null);
    };

    return (
        <RoleBasedAccess requiredPermission="user">
            <div className="flex min-h-screen bg-background">
                <Sidebar
                    isCollapsed={isSidebarCollapsed}
                    onToggleCollapse={setIsSidebarCollapsed}
                    collapsed={isSidebarCollapsed}
                />

                <main className="flex-1 ml-[68px] transition-smooth">
                    {/* Header Section */}
                    <div className="sticky top-0 z-40 bg-card border-b border-border">
                        <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                                        Client Management Dashboard
                                    </h1>
                                    <p className="text-sm md:text-base text-muted-foreground mt-2">
                                        Manage client relationships and track interactions
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <IntegrationStatus compact />
                                    <Button
                                        variant="default"
                                        iconName="Plus"
                                        iconPosition="left"
                                        onClick={() => setShowAddClientModal(true)}
                                    >
                                        Add Client
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="px-4 md:px-6 lg:px-8 py-6 md:py-8">
                        <Breadcrumb />

                        <div className="max-w-[1600px] mx-auto space-y-6">
                            <SearchFilters
                                onSearch={handleSearch}
                                onFilter={handleFilter}
                                onBulkAction={handleBulkAction}
                            />

                            <div className="grid grid-cols-1 lg:grid-cols-9 gap-4 md:gap-6">
                                <div className="lg:col-span-3 space-y-4">
                                    <div className="bg-card rounded-lg border border-border shadow-brand p-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-heading font-semibold text-sm text-foreground">
                                                Clients ({filteredClients?.length})
                                            </h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                iconName="RefreshCw"
                                                onClick={loadClients}
                                            />
                                        </div>
                                        <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                                            {error ? (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-destructive">{error}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={loadClients}
                                                        className="mt-2"
                                                    >
                                                        Retry
                                                    </Button>
                                                </div>
                                            ) : filteredClients?.length === 0 ? (
                                                <div className="text-center py-8">
                                                    <p className="text-sm text-muted-foreground">No clients found</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowAddClientModal(true)}
                                                        className="mt-2"
                                                    >
                                                        Add Your First Client
                                                    </Button>
                                                </div>
                                            ) : (
                                                filteredClients?.map((client) => (
                                                    <ClientCard
                                                        key={client?.id}
                                                        client={client}
                                                        isSelected={selectedClient?.id === client?.id}
                                                        onClick={() => handleClientSelect(client)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-6">
                                    <ClientProfile
                                        client={selectedClient}
                                        onEmailClick={() => setShowEmailComposer(true)}
                                        onCreateProposal={() => navigate("/proposal-management-dashboard")}
                                        onDeleteClick={() => handleDeleteClick(selectedClient)}
                                        onEditClick={() => handleEditClick(selectedClient)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <BulkActionsBar
                    selectedCount={selectedClients?.length}
                    onAction={handleBulkAction}
                    onClear={() => setSelectedClients([])}
                />

                {showEmailComposer && (
                    <EmailComposer
                        client={selectedClient}
                        onClose={() => setShowEmailComposer(false)}
                        onSend={handleEmailSend}
                    />
                )}

                {showAddClientModal && (
                    <AddClientModal
                        isOpen={showAddClientModal}
                        onClose={() => setShowAddClientModal(false)}
                        onSave={handleAddClient}
                    />
                )}

                <DeleteClientModal
                    client={clientToDelete}
                    isOpen={showDeleteModal}
                    onClose={handleDeleteCancel}
                    onConfirm={handleDeleteConfirm}
                    isDeleting={isDeleting}
                />

                <EditClientModal
                    isOpen={showEditModal}
                    onClose={handleEditCancel}
                    onSave={handleEditSave}
                    client={clientToEdit}
                />
            </div>
        </RoleBasedAccess>
    );
};

export default ClientManagementDashboard;
