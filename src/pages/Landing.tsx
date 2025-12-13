
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Users, Target, Shield, Zap, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Lead Management",
      description: "Capture, track, and nurture leads through your sales pipeline"
    },
    {
      icon: Target,
      title: "Deal Tracking",
      description: "Monitor deals and close more business with intelligent insights"
    },
    {
      icon: Shield,
      title: "Policy Management",
      description: "Manage insurance policies and renewals efficiently"
    },
    {
      icon: Zap,
      title: "Workflow Automation",
      description: "Automate lead assignment and follow-ups to boost productivity"
    }
  ];

  const plans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for small teams",
      features: [
        "Up to 1,000 leads",
        "5 team members",
        "Basic reporting",
        "Email support"
      ]
    },
    {
      name: "Professional",
      price: "$79",
      description: "For growing businesses",
      features: [
        "Up to 10,000 leads",
        "25 team members",
        "Advanced workflows",
        "Priority support",
        "Custom integrations"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      description: "For large organizations",
      features: [
        "Unlimited leads",
        "Unlimited team members",
        "Advanced analytics",
        "24/7 phone support",
        "Custom development"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/uploads/290f5141-96dd-44f0-bc7a-9e7b5407ecb6.png" 
              alt="InsureCRM Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-gray-900">InsureCRM</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/signin')}>
              Sign In
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            The Complete Insurance CRM Solution
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Streamline your insurance business with powerful lead management, automated workflows, 
            and intelligent deal tracking. Join thousands of agents who trust InsureCRM.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" className="text-lg px-8 py-3 bg-blue-600 hover:bg-blue-700">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-blue-600 text-blue-600 hover:bg-blue-50">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Grow Your Insurance Business
            </h2>
            <p className="text-lg text-gray-600">
              Powerful features designed specifically for insurance professionals
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-blue-100">
                <CardHeader>
                  <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 bg-blue-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600">
              Start free, upgrade as you grow
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'border-blue-500 border-2 shadow-lg' : 'border-blue-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600 my-4">
                    {plan.price}<span className="text-lg text-gray-600">/month</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-blue-600" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                    variant={plan.popular ? "default" : "outline"}
                    
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/uploads/290f5141-96dd-44f0-bc7a-9e7b5407ecb6.png" 
                  alt="InsureCRM Logo" 
                  className="h-6 w-6 brightness-0 invert"
                />
                <span className="text-lg font-bold">InsureCRM</span>
              </div>
              <p className="text-blue-200">
                The complete insurance CRM solution for modern agents.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white" >Product</h3>
              <ul className="space-y-2 text-white-200">
                <li>Features</li>
                <li>Pricing</li>
                <li>Integrations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-blue-200">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>API Docs</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2 text-blue-200">
                <li>About</li>
                <li>Blog</li>
                <li>Careers</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-blue-800 mt-8 pt-8 text-center text-blue-200">
            <p>&copy; 2025 InsureCRM. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
